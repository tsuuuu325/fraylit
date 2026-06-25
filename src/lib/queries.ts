import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CommentWithAuthor,
  NotificationWithActor,
  PostWithMeta,
  Profile
} from './types';

type DB = SupabaseClient;

const POST_SELECT = `
  id, user_id, mode, opening_lines, closing_lines, twist_lines, created_at,
  author:profiles!posts_user_id_fkey ( id, username, display_name, avatar_url ),
  likes:likes ( count ),
  comments:comments ( count )
`;

type RawPost = {
  id: string;
  user_id: string;
  mode: PostWithMeta['mode'];
  opening_lines: string | null;
  closing_lines: string | null;
  twist_lines: string | null;
  created_at: string;
  author: PostWithMeta['author'] | PostWithMeta['author'][] | null;
  likes: { count: number }[] | null;
  comments: { count: number }[] | null;
};

function firstCount(rows: { count: number }[] | null): number {
  return rows && rows.length > 0 ? rows[0].count : 0;
}

function normalizeAuthor(
  author: RawPost['author']
): PostWithMeta['author'] {
  const a = Array.isArray(author) ? author[0] : author;
  return (
    a ?? {
      id: '',
      username: 'unknown',
      display_name: 'Unknown',
      avatar_url: null
    }
  );
}

async function attachLikedByMe(
  supabase: DB,
  posts: RawPost[],
  currentUserId: string | null
): Promise<Set<string>> {
  if (!currentUserId || posts.length === 0) return new Set();
  const ids = posts.map((p) => p.id);
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', currentUserId)
    .in('post_id', ids);
  return new Set((data ?? []).map((r) => r.post_id));
}

function toPostWithMeta(raw: RawPost, likedIds: Set<string>): PostWithMeta {
  return {
    id: raw.id,
    user_id: raw.user_id,
    mode: raw.mode,
    opening_lines: raw.opening_lines,
    closing_lines: raw.closing_lines,
    twist_lines: raw.twist_lines,
    created_at: raw.created_at,
    author: normalizeAuthor(raw.author),
    like_count: firstCount(raw.likes),
    comment_count: firstCount(raw.comments),
    liked_by_me: likedIds.has(raw.id)
  };
}

export async function getTimeline(
  supabase: DB,
  currentUserId: string | null,
  limit = 50
): Promise<PostWithMeta[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  const raw = (data ?? []) as unknown as RawPost[];
  const liked = await attachLikedByMe(supabase, raw, currentUserId);
  return raw.map((p) => toPostWithMeta(p, liked));
}

export async function getProfileByUsername(
  supabase: DB,
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPostsByUser(
  supabase: DB,
  userId: string,
  currentUserId: string | null
): Promise<PostWithMeta[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const raw = (data ?? []) as unknown as RawPost[];
  const liked = await attachLikedByMe(supabase, raw, currentUserId);
  return raw.map((p) => toPostWithMeta(p, liked));
}

export async function getComments(
  supabase: DB,
  postId: string
): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `id, user_id, post_id, content, created_at,
       author:profiles!comments_user_id_fkey ( id, username, display_name, avatar_url )`
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c) => {
    const a = Array.isArray(
      (c as unknown as { author: unknown }).author
    )
      ? (c as unknown as { author: CommentWithAuthor['author'][] }).author[0]
      : (c as unknown as { author: CommentWithAuthor['author'] }).author;
    return {
      id: c.id,
      user_id: c.user_id,
      post_id: c.post_id,
      content: c.content,
      created_at: c.created_at,
      author: a ?? {
        id: '',
        username: 'unknown',
        display_name: 'Unknown',
        avatar_url: null
      }
    };
  });
}

const NOTIFICATION_SELECT = `
  id, user_id, actor_id, post_id, type, comment_id, read_at, created_at,
  actor:profiles!notifications_actor_id_fkey ( id, username, display_name, avatar_url )
`;

function normalizeNotificationActor(
  actor: NotificationWithActor['actor'] | NotificationWithActor['actor'][] | null
): NotificationWithActor['actor'] {
  const a = Array.isArray(actor) ? actor[0] : actor;
  return (
    a ?? {
      id: '',
      username: 'unknown',
      display_name: 'Unknown',
      avatar_url: null
    }
  );
}

export async function getNotifications(
  supabase: DB,
  userId: string,
  limit = 30
): Promise<NotificationWithActor[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const n = row as unknown as NotificationWithActor & {
      actor: NotificationWithActor['actor'] | NotificationWithActor['actor'][] | null;
    };
    return {
      id: n.id,
      user_id: n.user_id,
      actor_id: n.actor_id,
      post_id: n.post_id,
      type: n.type,
      comment_id: n.comment_id,
      read_at: n.read_at,
      created_at: n.created_at,
      actor: normalizeNotificationActor(n.actor)
    };
  });
}

export async function getUnreadNotificationCount(
  supabase: DB,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return count ?? 0;
}

export async function markAllNotificationsRead(
  supabase: DB,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
}
