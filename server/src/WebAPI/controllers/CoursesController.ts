import { Request, Response, Router } from 'express';
import db from '../../Database/connection/DbConnectionPool';
import { authenticateFastapi } from '../../Middlewares/authentification/FastapiJwtAuth';

export class CoursesController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Public list of courses (no auth required) to match previous FastAPI behavior
    this.router.get('/courses/', this.getAllCourses.bind(this));
    // Register more specific routes BEFORE parametric ':id' to avoid shadowing
    this.router.get('/courses/my-enrollments', authenticateFastapi, this.myEnrollments.bind(this));
    this.router.post('/courses/enroll', authenticateFastapi, this.enroll.bind(this));
    this.router.delete('/courses/unenroll/:courseId', authenticateFastapi, this.unenroll.bind(this));
    this.router.get('/courses/:id', authenticateFastapi, this.getCourseById.bind(this));
  }

  private async getAllCourses(req: Request, res: Response) {
    try {
      const skip = parseInt((req.query.skip as string) || '0', 10);
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const result = await db.query(
        'SELECT id, name, description, code, is_active, created_at FROM courses WHERE is_active = true ORDER BY id ASC OFFSET $1 LIMIT $2',
        [skip, limit]
      );
      res.json(result.rows);
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async getCourseById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await db.query(
        'SELECT id, name, description, code, is_active, created_at FROM courses WHERE id = $1',
        [id]
      );
      if (!result.rows.length) {
        res.status(404).json({ detail: 'Course not found' });
        return;
      }
      res.json(result.rows[0]);
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async enroll(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const { course_id } = req.body as { course_id: number };
      if (!course_id) {
        res.status(400).json({ detail: 'course_id is required' });
        return;
      }

      const course = await db.query('SELECT id FROM courses WHERE id = $1', [course_id]);
      if (!course.rows.length) {
        res.status(404).json({ detail: 'Course not found' });
        return;
      }

      const already = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, course_id]);
      if (already.rows.length) {
        res.status(400).json({ detail: 'Already enrolled in this course' });
        return;
      }

      const countRes = await db.query('SELECT COUNT(*)::int AS cnt FROM enrollments WHERE user_id = $1', [user.id]);
      if (countRes.rows[0].cnt >= 3) {
        res.status(400).json({ detail: 'Cannot enroll in more than 3 courses' });
        return;
      }

      const insert = await db.query(
        'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) RETURNING id, user_id, course_id, enrolled_at',
        [user.id, course_id]
      );
      res.json(insert.rows[0]);
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async myEnrollments(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const result = await db.query(
        `SELECT e.id, e.user_id, e.course_id, e.enrolled_at,
                c.id AS c_id, c.name AS c_name, c.description AS c_description, c.code AS c_code, c.is_active AS c_is_active, c.created_at AS c_created_at
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.user_id = $1
         ORDER BY e.id ASC`,
        [user.id]
      );
      const rows = result.rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        course_id: r.course_id,
        enrolled_at: r.enrolled_at,
        course: {
          id: r.c_id,
          name: r.c_name,
          description: r.c_description,
          code: r.c_code,
          is_active: r.c_is_active,
          created_at: r.c_created_at,
        },
      }));
      res.json(rows);
    } catch (err) {
      console.error('myEnrollments error:', err);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async unenroll(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const courseId = parseInt(req.params.courseId, 10);
      const course = await db.query('SELECT id FROM courses WHERE id = $1', [courseId]);
      if (!course.rows.length) {
        res.status(404).json({ detail: 'Course not found' });
        return;
      }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, courseId]);
      if (!enrolled.rows.length) {
        res.status(400).json({ detail: 'Not enrolled in this course' });
        return;
      }
      await db.query('DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, courseId]);
      res.json({ message: 'Successfully unenrolled from course' });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  public getRouter() {
    return this.router;
  }
}

