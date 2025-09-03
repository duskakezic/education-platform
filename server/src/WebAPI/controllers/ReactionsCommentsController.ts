import { Request, Response, Router } from 'express';
import db from '../../Database/connection/DbConnectionPool';
import { authenticateFastapi, requireRole } from '../../Middlewares/authentification/FastapiJwtAuth';
import multer from 'multer';

export class ReactionsCommentsController {
  private router: Router;
  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Reactions
    this.router.post('/announcements/:id/react', authenticateFastapi, requireRole('student'), multer().none(), this.react.bind(this));
    this.router.delete('/announcements/:id/react', authenticateFastapi, this.unreact.bind(this));

    // Comments
    this.router.get('/announcements/:id/comments', authenticateFastapi, this.listComments.bind(this));
    this.router.post('/announcements/:id/comments', authenticateFastapi, requireRole('student'), this.createComment.bind(this));
    this.router.put('/announcements/comments/:commentId', authenticateFastapi, this.updateComment.bind(this));
    this.router.delete('/announcements/comments/:commentId', authenticateFastapi, this.deleteComment.bind(this));
  }

  private async react(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const announcementId = parseInt(req.params.id, 10);
      const reaction_type = req.body.reaction_type as string;
      if (!['like', 'dislike'].includes(String(reaction_type))) {
        res.status(400).json({ detail: `Invalid reaction type: ${reaction_type}. Must be 'like' or 'dislike'` });
        return;
      }
      const ann = await db.query('SELECT course_id FROM announcements WHERE id = $1', [announcementId]);
      if (!ann.rows.length) { res.status(404).json({ detail: 'Announcement not found' }); return; }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, ann.rows[0].course_id]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }

      const existing = await db.query('SELECT id FROM reactions WHERE user_id = $1 AND announcement_id = $2', [user.id, announcementId]);
      if (existing.rows.length) {
        const upd = await db.query('UPDATE reactions SET reaction_type = $1 WHERE id = $2 RETURNING id, user_id, announcement_id, reaction_type, created_at', [reaction_type.toUpperCase(), existing.rows[0].id]);
        res.json({...upd.rows[0], reaction_type: upd.rows[0].reaction_type.toLowerCase()});
        return;
      }
      const ins = await db.query('INSERT INTO reactions (user_id, announcement_id, reaction_type) VALUES ($1,$2,$3) RETURNING id, user_id, announcement_id, reaction_type, created_at', [user.id, announcementId, reaction_type.toUpperCase()]);
      res.json({...ins.rows[0], reaction_type: ins.rows[0].reaction_type.toLowerCase()});
    } catch (e) {
      console.error('Reactions react error:', e);
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async unreact(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const announcementId = parseInt(req.params.id, 10);
      const ann = await db.query('SELECT course_id FROM announcements WHERE id = $1', [announcementId]);
      if (!ann.rows.length) { res.status(404).json({ detail: 'Announcement not found' }); return; }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, ann.rows[0].course_id]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      const del = await db.query('DELETE FROM reactions WHERE user_id = $1 AND announcement_id = $2', [user.id, announcementId]);
      if ((del.rowCount ?? 0) === 0) { res.status(404).json({ detail: 'No reaction found to remove' }); return; }
      res.json({ message: 'Reaction removed successfully' });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async listComments(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const announcementId = parseInt(req.params.id, 10);
      const ann = await db.query('SELECT course_id FROM announcements WHERE id = $1', [announcementId]);
      if (!ann.rows.length) { res.status(404).json({ detail: 'Announcement not found' }); return; }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, ann.rows[0].course_id]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      const skip = parseInt((req.query.skip as string) || '0', 10);
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const comments = await db.query(
        `SELECT c.id, c.content, c.announcement_id, c.author_id, c.created_at, c.updated_at,
                u.id as uid, u.email, u.username, u.full_name, u.role, u.is_active, u.created_at as u_created
         FROM comments c JOIN users u ON u.id = c.author_id WHERE c.announcement_id = $1
         OFFSET $2 LIMIT $3`,
        [announcementId, skip, limit]
      );
      const data = comments.rows.map(row => ({
        id: row.id,
        content: row.content,
        announcement_id: row.announcement_id,
        author_id: row.author_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author: {
          id: row.uid,
          email: row.email,
          username: row.username,
          full_name: row.full_name,
          role: row.role.toLowerCase(),
          is_active: row.is_active,
          created_at: row.u_created,
        }
      }));
      res.json(data);
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async createComment(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const announcementId = parseInt(req.params.id, 10);
      const { content } = req.body as { content: string };
      const ann = await db.query('SELECT course_id FROM announcements WHERE id = $1', [announcementId]);
      if (!ann.rows.length) { res.status(404).json({ detail: 'Announcement not found' }); return; }
      const enrolled = await db.query('SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2', [user.id, ann.rows[0].course_id]);
      if (!enrolled.rows.length) { res.status(403).json({ detail: 'Not enrolled in this course' }); return; }
      const insert = await db.query(
        'INSERT INTO comments (content, author_id, announcement_id) VALUES ($1,$2,$3) RETURNING id, content, announcement_id, author_id, created_at, updated_at',
        [content, user.id, announcementId]
      );
      const row = insert.rows[0];
      const authorRes = await db.query('SELECT id, email, username, full_name, role, is_active, created_at FROM users WHERE id = $1', [user.id]);
      const author = authorRes.rows[0];
      res.json({ ...row, author: { ...author, role: author.role.toLowerCase() } });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async updateComment(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const commentId = parseInt(req.params.commentId, 10);
      const { content } = req.body as { content: string };
      const comment = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
      if (!comment.rows.length) { res.status(404).json({ detail: 'Comment not found' }); return; }
      if (comment.rows[0].author_id !== user.id) { res.status(403).json({ detail: 'Can only update your own comments' }); return; }
      const upd = await db.query('UPDATE comments SET content = $1 WHERE id = $2 RETURNING id, content, announcement_id, author_id, created_at, updated_at', [content, commentId]);
      const authorRes = await db.query('SELECT id, email, username, full_name, role, is_active, created_at FROM users WHERE id = $1', [user.id]);
      const author = authorRes.rows[0];
      res.json({ ...upd.rows[0], author: { ...author, role: author.role.toLowerCase() } });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  private async deleteComment(req: Request, res: Response) {
    try {
      const user = req.currentUser!;
      const commentId = parseInt(req.params.commentId, 10);
      const comment = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
      if (!comment.rows.length) { res.status(404).json({ detail: 'Comment not found' }); return; }
      if (comment.rows[0].author_id !== user.id) { res.status(403).json({ detail: 'Can only delete your own comments' }); return; }
      await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
      res.json({ message: 'Comment deleted successfully' });
    } catch {
      res.status(500).json({ detail: 'Internal Server Error' });
    }
  }

  public getRouter() { return this.router; }
}


