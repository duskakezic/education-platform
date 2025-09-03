import { Request, Response, Router } from 'express';
import db from '../../Database/connection/DbConnectionPool';
import { authenticateFastapi, requireRole } from '../../Middlewares/authentification/FastapiJwtAuth';
import { imageUpload } from '../../utils/uploads';

export class AnnouncementsController {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Register specific route before parametric :id
    this.router.get('/announcements/course/:courseId', authenticateFastapi, this.listByCourse.bind(this));
    this.router.get('/announcements/:id', authenticateFastapi, this.getById.bind(this));
    this.router.post('/announcements/', authenticateFastapi, requireRole('professor'), imageUpload.single('image'), this.create.bind(this));
    this.router.put('/announcements/:id', authenticateFastapi, requireRole('professor'), imageUpload.single('image'), this.update.bind(this));
    this.router.delete('/announcements/:id', authenticateFastapi, requireRole('professor'), this.remove.bind(this));
  }

  private async listByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params;
      const user = req.currentUser!;
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, courseId]);
      if (!enrolled.rows.length) {
        res.status(403).json({ detail: 'Not enrolled in this course' });
        return;
      }
      const skip = parseInt((req.query.skip as string) || '0', 10);
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const anns = await db.query(
        `SELECT a.id, a.title, a.content, a.course_id, a.image_url, a.author_id, a.created_at, a.updated_at,
                u.id as author_id2, u.email, u.username, u.full_name, u.role, u.is_active, u.created_at as user_created,
                COALESCE(lc.like_count, 0) AS like_count,
                COALESCE(dc.dislike_count, 0) AS dislike_count,
                COALESCE(cc.comment_count, 0) AS comment_count,
                ur.user_reaction
         FROM announcements a
         JOIN users u ON u.id = a.author_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS like_count FROM reactions r
           WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'like'
         ) lc ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS dislike_count FROM reactions r
           WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'dislike'
         ) dc ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS comment_count FROM comments c
           WHERE c.announcement_id = a.id
         ) cc ON TRUE
         LEFT JOIN LATERAL (
           SELECT LOWER(r.reaction_type::text) AS user_reaction FROM reactions r
           WHERE r.user_id = $2 AND r.announcement_id = a.id
           LIMIT 1
         ) ur ON TRUE
         WHERE a.course_id = $1
         ORDER BY a.created_at DESC OFFSET $3 LIMIT $4`,
        [courseId, user.id, skip, limit]
      );
      const data = anns.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        course_id: row.course_id,
        image_url: row.image_url,
        author_id: row.author_id,
        author: {
          id: row.author_id2,
          email: row.email,
          username: row.username,
          full_name: row.full_name,
          role: row.role.toLowerCase(),
          is_active: row.is_active,
          created_at: row.user_created,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
        like_count: row.like_count || 0,
        dislike_count: row.dislike_count || 0,
        comment_count: row.comment_count || 0,
        user_reaction: row.user_reaction || null,
      }));
      res.json(data);
    } catch (e) {
      console.error('Announcements listByCourse error:', e);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.currentUser!;
      const ann = await db.query(
        `SELECT a.id, a.title, a.content, a.course_id, a.image_url, a.author_id, a.created_at, a.updated_at,
                u.email, u.username, u.full_name, u.role, u.is_active, u.created_at as user_created,
                COALESCE(lc.like_count, 0) AS like_count,
                COALESCE(dc.dislike_count, 0) AS dislike_count,
                COALESCE(cc.comment_count, 0) AS comment_count,
                ur.user_reaction
         FROM announcements a
         JOIN users u ON u.id = a.author_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS like_count FROM reactions r
           WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'like'
         ) lc ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS dislike_count FROM reactions r
           WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'dislike'
         ) dc ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS comment_count FROM comments c
           WHERE c.announcement_id = a.id
         ) cc ON TRUE
         LEFT JOIN LATERAL (
           SELECT LOWER(r.reaction_type::text) AS user_reaction FROM reactions r
           WHERE r.user_id = $2 AND r.announcement_id = a.id
           LIMIT 1
         ) ur ON TRUE
         WHERE a.id = $1`, [id, user.id]
      );
      if (!ann.rows.length) {
        res.status(404).json({ detail: 'Announcement not found' });
        return;
      }
      const row = ann.rows[0];
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, row.course_id]);
      if (!enrolled.rows.length) {
        res.status(403).json({ detail: 'Not enrolled in this course' });
        return;
      }
      res.json({
        id: row.id,
        title: row.title,
        content: row.content,
        course_id: row.course_id,
        image_url: row.image_url,
        author_id: row.author_id,
        author: {
          id: row.author_id,
          email: row.email,
          username: row.username,
          full_name: row.full_name,
          role: row.role.toLowerCase(),
          is_active: row.is_active,
          created_at: row.user_created,
        },
        created_at: row.created_at,
        updated_at: row.updated_at,
        like_count: row.like_count || 0,
        dislike_count: row.dislike_count || 0,
        comment_count: row.comment_count || 0,
        user_reaction: row.user_reaction || null,
      });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async create(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const { title, content, course_id } = req.body as { title: string; content: string; course_id: string };
      const courseId = parseInt(course_id, 10);
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, courseId]);
      if (!enrolled.rows.length) {
        res.status(403).json({ detail: 'Not enrolled in this course' });
        return;
      }
      let image_url: string | null = null;
      if (req.file) {
        image_url = `uploads/images/${req.file.filename}`;
      }
      const insert = await db.query(
        `INSERT INTO announcements (title, content, course_id, image_url, author_id)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, title, content, course_id, image_url, author_id, created_at, updated_at`,
        [title, content, courseId, image_url, user.id]
      );
      const ann = insert.rows[0];
      res.json({
        ...ann,
        author: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          role: user.role.toLowerCase(),
          is_active: user.is_active,
          created_at: user.created_at,
        },
        like_count: 0,
        dislike_count: 0,
        comment_count: 0,
        user_reaction: null,
      });
    } catch (e) {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async update(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const id = parseInt(req.params.id, 10);
      const existing = await db.query('SELECT * FROM announcements WHERE id = $1', [id]);
      if (!existing.rows.length) {
        res.status(404).json({ detail: 'Announcement not found' });
        return;
      }
      const row = existing.rows[0];
      if (row.author_id !== user.id) {
        res.status(403).json({ detail: 'Can only update your own announcements' });
        return;
      }
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;
      if (typeof req.body.title !== 'undefined') { fields.push(`title = $${idx++}`); values.push(req.body.title); }
      if (typeof req.body.content !== 'undefined') { fields.push(`content = $${idx++}`); values.push(req.body.content); }
      if (req.file) { fields.push(`image_url = $${idx++}`); values.push(`uploads/images/${req.file.filename}`); }
      if (!fields.length) {
        // nothing to update, re-fetch with full author info and counts
        const ann = await db.query(
          `SELECT a.id, a.title, a.content, a.course_id, a.image_url, a.author_id, a.created_at, a.updated_at,
                  u.email, u.username, u.full_name, u.role, u.is_active, u.created_at as user_created,
                  COALESCE(lc.like_count, 0) AS like_count,
                  COALESCE(dc.dislike_count, 0) AS dislike_count,
                  COALESCE(cc.comment_count, 0) AS comment_count,
                  ur.user_reaction
           FROM announcements a
           JOIN users u ON u.id = a.author_id
           LEFT JOIN LATERAL (
             SELECT COUNT(*)::int AS like_count FROM reactions r
             WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'like'
           ) lc ON TRUE
           LEFT JOIN LATERAL (
             SELECT COUNT(*)::int AS dislike_count FROM reactions r
             WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'dislike'
           ) dc ON TRUE
           LEFT JOIN LATERAL (
             SELECT COUNT(*)::int AS comment_count FROM comments c
             WHERE c.announcement_id = a.id
           ) cc ON TRUE
           LEFT JOIN LATERAL (
             SELECT LOWER(r.reaction_type::text) AS user_reaction FROM reactions r
             WHERE r.user_id = $2 AND r.announcement_id = a.id
             LIMIT 1
           ) ur ON TRUE
           WHERE a.id = $1`, [id, user.id]
        );
        const annRow = ann.rows[0];
        res.json({
          id: annRow.id,
          title: annRow.title,
          content: annRow.content,
          course_id: annRow.course_id,
          image_url: annRow.image_url,
          author_id: annRow.author_id,
          author: {
            id: annRow.author_id,
            email: annRow.email,
            username: annRow.username,
            full_name: annRow.full_name,
            role: annRow.role.toLowerCase(),
            is_active: annRow.is_active,
            created_at: annRow.user_created,
          },
          created_at: annRow.created_at,
          updated_at: annRow.updated_at,
          like_count: annRow.like_count || 0,
          dislike_count: annRow.dislike_count || 0,
          comment_count: annRow.comment_count || 0,
          user_reaction: annRow.user_reaction || null,
        });
        return;
      }
      values.push(id);
      const update = await db.query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
      const updated = update.rows[0];
      
      // Fetch updated announcement with full author info and counts
      const fullAnn = await db.query(
        `SELECT a.id, a.title, a.content, a.course_id, a.image_url, a.author_id, a.created_at, a.updated_at,
                u.email, u.username, u.full_name, u.role, u.is_active, u.created_at as user_created,
                COALESCE(lc.like_count, 0) AS like_count,
                COALESCE(dc.dislike_count, 0) AS dislike_count,
                COALESCE(cc.comment_count, 0) AS comment_count,
                ur.user_reaction
         FROM announcements a
         JOIN users u ON u.id = a.author_id
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS like_count FROM reactions r
           WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'like'
         ) lc ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS dislike_count FROM reactions r
           WHERE r.announcement_id = a.id AND LOWER(r.reaction_type::text) = 'dislike'
         ) dc ON TRUE
         LEFT JOIN LATERAL (
           SELECT COUNT(*)::int AS comment_count FROM comments c
           WHERE c.announcement_id = a.id
         ) cc ON TRUE
         LEFT JOIN LATERAL (
           SELECT LOWER(r.reaction_type::text) AS user_reaction FROM reactions r
           WHERE r.user_id = $2 AND r.announcement_id = a.id
           LIMIT 1
         ) ur ON TRUE
         WHERE a.id = $1`, [id, user.id]
      );
      const fullRow = fullAnn.rows[0];
      res.json({
        id: fullRow.id,
        title: fullRow.title,
        content: fullRow.content,
        course_id: fullRow.course_id,
        image_url: fullRow.image_url,
        author_id: fullRow.author_id,
        author: {
          id: fullRow.author_id,
          email: fullRow.email,
          username: fullRow.username,
          full_name: fullRow.full_name,
          role: fullRow.role.toLowerCase(),
          is_active: fullRow.is_active,
          created_at: fullRow.user_created,
        },
        created_at: fullRow.created_at,
        updated_at: fullRow.updated_at,
        like_count: fullRow.like_count || 0,
        dislike_count: fullRow.dislike_count || 0,
        comment_count: fullRow.comment_count || 0,
        user_reaction: fullRow.user_reaction || null,
      });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async remove(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const id = parseInt(req.params.id, 10);
      const ann = await db.query('SELECT * FROM announcements WHERE id = $1', [id]);
      if (!ann.rows.length) {
        res.status(404).json({ detail: 'Announcement not found' });
        return;
      }
      if (ann.rows[0].author_id !== user.id) {
        res.status(403).json({ detail: 'Can only delete your own announcements' });
        return;
      }
      
      await db.query('DELETE FROM reactions WHERE announcement_id = $1', [ann.rows[0].id]);
      await db.query('DELETE FROM comments WHERE announcement_id = $1', [ann.rows[0].id]);
      await db.query('DELETE FROM announcements WHERE id = $1', [ann.rows[0].id]);
      
      res.json({ message: 'Announcement deleted successfully' });
    } catch (e) {
      console.error('Announcements remove error:', e);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  public getRouter() {
    return this.router;
  }
}


