import { Request, Response, Router } from 'express';
import db from '../../Database/connection/DbConnectionPool';
import { authenticateFastapi, requireRole } from '../../Middlewares/authentification/FastapiJwtAuth';
import { materialUpload } from '../../utils/uploads';
import path from 'path';
import fs from 'fs';

export class MaterialsController {
  private router: Router;
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/materials/course/:courseId', authenticateFastapi, this.listByCourse.bind(this));
    this.router.get('/materials/:id', authenticateFastapi, this.getById.bind(this));
    this.router.post('/materials/', authenticateFastapi, requireRole('professor'), materialUpload.single('file'), this.create.bind(this));
    this.router.delete('/materials/:id', authenticateFastapi, requireRole('professor'), this.remove.bind(this));
    this.router.get('/materials/download/:id', authenticateFastapi, this.download.bind(this));
  }

  private async listByCourse(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const { courseId } = req.params;
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, courseId]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      const skip = parseInt((req.query.skip as string) || '0', 10);
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const mats = await db.query(
        'SELECT id, title, description, course_id, file_url, file_name, file_size, author_id, created_at FROM learning_materials WHERE course_id = $1 ORDER BY created_at DESC OFFSET $2 LIMIT $3',
        [courseId, skip, limit]
      );
      res.json(mats.rows);
    } catch { res.status(500).json({ detail: 'Internal Server Error' }); }
  }

  private async getById(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const id = parseInt(req.params.id, 10);
      const mat = await db.query('SELECT * FROM learning_materials WHERE id = $1', [id]);
      if (!mat.rows.length) { res.status(404).json({ detail: 'Learning material not found' }); return; }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, mat.rows[0].course_id]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      res.json({
        id: mat.rows[0].id,
        title: mat.rows[0].title,
        description: mat.rows[0].description,
        course_id: mat.rows[0].course_id,
        file_url: mat.rows[0].file_url,
        file_name: mat.rows[0].file_name,
        file_size: mat.rows[0].file_size,
        author_id: mat.rows[0].author_id,
        created_at: mat.rows[0].created_at,
      });
    } catch { res.status(500).json({ detail: 'Internal Server Error' }); }
  }

  private async create(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const { title, description, course_id } = req.body as { title: string; description?: string; course_id: string };
      const courseId = parseInt(course_id, 10);
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, courseId]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      if (!req.file) { res.status(400).json({ detail: 'File is required' }); return; }
      const file_url = `uploads/materials/${req.file.filename}`;
      const file_name = req.file.originalname;
      const file_size = req.file.size;
      const insert = await db.query(
        `INSERT INTO learning_materials (title, description, course_id, file_url, file_name, file_size, author_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, title, description, course_id, file_url, file_name, file_size, author_id, created_at`,
        [title, description || null, courseId, file_url, file_name, file_size, user.id]
      );
      res.json(insert.rows[0]);
    } catch { res.status(500).json({ detail: 'Internal Server Error' }); }
  }

  private async remove(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const id = parseInt(req.params.id, 10);
      const mat = await db.query('SELECT * FROM learning_materials WHERE id = $1', [id]);
      if (!mat.rows.length) { res.status(404).json({ detail: 'Learning material not found' }); return; }
      if (mat.rows[0].author_id !== user.id) { res.status(403).json({ detail: 'Can only delete your own learning materials' }); return; }
      // delete file
      const abs = path.resolve(process.cwd(), mat.rows[0].file_url);
      try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch {}
      await db.query('DELETE FROM learning_materials WHERE id = $1', [id]);
      res.json({ message: 'Learning material deleted successfully' });
    } catch { res.status(500).json({ detail: 'Internal Server Error' }); }
  }

  private async download(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const id = parseInt(req.params.id, 10);
      const mat = await db.query('SELECT * FROM learning_materials WHERE id = $1', [id]);
      if (!mat.rows.length) { res.status(404).json({ detail: 'Learning material not found' }); return; }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, mat.rows[0].course_id]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      const abs = path.resolve(process.cwd(), mat.rows[0].file_url);
      if (!fs.existsSync(abs)) { res.status(404).json({ detail: 'File not found on server' }); return; }
      res.download(abs, mat.rows[0].file_name);
    } catch { res.status(500).json({ detail: 'Internal Server Error' }); }
  }

  public getRouter() { return this.router; }
}


