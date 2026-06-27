import type { Database, PostMode } from './database.types';

export type { PostMode };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationType = Database['public']['Tables']['notifications']['Row']['type'];

export interface PostAuthor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_paid: boolean;
}

export interface PostWithMeta extends Post {
  author: PostAuthor;
  like_count: number;
  comment_count: number;
  view_count: number;
  liked_by_me: boolean;
}

export interface CommentWithAuthor extends Comment {
  author: PostAuthor;
}

export interface NotificationWithActor extends Notification {
  actor: PostAuthor;
}
