import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../../Database/connection/DbConnectionPool';
import { UserRecord } from '../../utils/types';

export async function authenticateFastapi(req: Request, res: Response, next: NextFunction) {
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
      const result = await db.query(
        'SELECT id, email, username, full_name, role, is_active, created_at, hashed_password FROM users WHERE email = $1',
        [decoded.sub]
      );
      if (!result.rows.length) {
        res.status(401).json({ detail: 'Could not validate credentials' });
        return;
      }
      const user = result.rows[0] as UserRecord;
      if (!user.is_active) {
        res.status(400).json({ detail: 'Inactive user' });
        return;
      }
      req.currentUser = user;
      next();
    } catch (err) {
      console.error('authenticateFastapi verify/query error:', err);
      res.status(401).json({ detail: 'Could not validate credentials' });
    }
  } catch {
    console.error('authenticateFastapi unexpected error');
    res.status(500).json({ detail: 'Internal Server Error' });
  }
}

export function requireRole(role: 'professor' | 'student') {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.currentUser;
    if (!user) {
      res.status(401).json({ detail: 'Could not validate credentials' });
      return;
    }
    if (user.role.toLowerCase() !== role.toLowerCase()) {
      res.status(403).json({ detail: 'Forbidden' });
      return;
    }
    next();
  };
}

