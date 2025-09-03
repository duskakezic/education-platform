export type UserRole = 'professor' | 'student';

export interface UserRecord {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  hashed_password: string;
}

export interface CourseRecord {
  id: number;
  name: string;
  description: string | null;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface EnrollmentRecord {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
}

export interface AnnouncementRecord {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  author_id: number;
  course_id: number;
  created_at: string;
  updated_at: string | null;
}

export type ReactionType = 'like' | 'dislike';

export interface ReactionRecord {
  id: number;
  user_id: number;
  announcement_id: number;
  reaction_type: ReactionType;
  created_at: string;
}

export interface CommentRecord {
  id: number;
  content: string;
  author_id: number;
  announcement_id: number;
  created_at: string;
  updated_at: string | null;
}

