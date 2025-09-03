import { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import db from '../../Database/connection/DbConnectionPool';
import { UserRecord } from '../../utils/types';

export class AuthController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Exact FastAPI-compatible routes under /api
    this.router.post('/auth/register', this.register.bind(this));
    // Parse multipart or urlencoded form fields for login
    this.router.post('/auth/login', multer().none(), this.login.bind(this));
    this.router.get('/auth/me', this.me.bind(this));
  }

  private async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, full_name, password, role } = req.body;

      if (!email || !username || !full_name || !password || !role) {
        res.status(400).json({ detail: 'Missing required fields' });
        return;
      }

      if (String(password).length < 8) {
        res.status(400).json({ detail: 'Password must be at least 8 characters long' });
        return;
      }

      // unique checks
      const existingEmail = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingEmail.rows.length) {
        res.status(400).json({ detail: 'Email already registered' });
        return;
      }

      const existingUsername = await db.query('SELECT id FROM users WHERE username = $1', [username]);
      if (existingUsername.rows.length) {
        res.status(400).json({ detail: 'Username already taken' });
        return;
      }

      const hashed = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS || '10', 10));
      const insert = await db.query(
        `INSERT INTO users (email, username, full_name, hashed_password, role, is_active)
         VALUES ($1,$2,$3,$4,$5,true) RETURNING id, email, username, full_name, role, is_active, created_at`,
        [email, username, full_name, hashed, role]
      );

      const user = insert.rows[0];
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      // Frontend sends form-data with fields username (email) and password
      const contentType = req.headers['content-type'] || '';
      let email: string | undefined;
      let password: string | undefined;

      if (contentType.includes('application/x-www-form-urlencoded')) {
        email = (req.body.username as string) || '';
        password = (req.body.password as string) || '';
      } else {
        email = (req.body.username as string) || (req.body.email as string) || '';
        password = (req.body.password as string) || '';
      }

      if (!email || !password) {
        res.status(400).json({ detail: 'Missing credentials' });
        return;
      }

      const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (!userResult.rows.length) {
        res.status(401).json({ detail: 'Incorrect email or password' });
        return;
      }

      const user = userResult.rows[0] as UserRecord & { password?: string };
      const valid = await bcrypt.compare(password, user.hashed_password);
      if (!valid) {
        res.status(401).json({ detail: 'Incorrect email or password' });
        return;
      }

      const minutes = parseInt(process.env.JWT_EXPIRES_MINUTES || '30', 10);
      const token = jwt.sign(
        { sub: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: minutes * 60 }
      );

      res.json({ access_token: token, token_type: 'bearer' });
    } catch (err) {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async me(req: Request, res: Response): Promise<void> {
    try {
      const auth = req.headers.authorization || '';
      if (!auth.startsWith('Bearer ')) {
        res.status(401).json({ detail: 'Could not validate credentials' });
        return;
      }
      const token = auth.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { sub?: string };
        if (!decoded?.sub) {
          res.status(401).json({ detail: 'Could not validate credentials' });
          return;
        }
        const userResult = await db.query(
          'SELECT id, email, username, full_name, role, is_active, created_at FROM users WHERE email = $1',
          [decoded.sub]
        );
        if (!userResult.rows.length) {
          res.status(401).json({ detail: 'Could not validate credentials' });
          return;
        }
        const user = userResult.rows[0];
        res.json({ ...user, role: user.role.toLowerCase() });
      } catch {
        res.status(401).json({ detail: 'Could not validate credentials' });
      }
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}