'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LIMITS } from '@/lib/validation';
import type { CommentWithAuthor, PostAuthor } from '@/lib/types';
import Avatar from './Avatar';

export default function CommentSection({
  postId,
  initialCount,
  viewer
}: {
  postId: string;
  initialCount: number;
  viewer: PostAuthor | null;
}) {
  const t = useTranslations('post');
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [count, setCount] = useState(initialCount);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  async function loadComments() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('comments')
      .select(
        `id, user_id, post_id, content, created_at,
         author:profiles!comments_user_id_fkey ( id, username, display_name, avatar_url )`
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    const rows = (data ?? []).map((c) => {
      const raw = c as unknown as {
        id: string;
        user_id: string;
        post_id: string;
        content: string;
        created_at: string;
        author: PostAuthor | PostAuthor[] | null;
      };
      const a = Array.isArray(raw.author) ? raw.author[0] : raw.author;
      return {
        ...raw,
        author:
          a ?? {
            id: '',
            username: 'unknown',
            display_name: 'Unknown',
            avatar_url: null
          }
      } as CommentWithAuthor;
    });

    setComments(rows);
    setCount(rows.length);
    setLoaded(true);
    setLoading(false);
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) void loadComments();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!viewer) return;
    const content = draft.trim();
    if (!content) return;

    setPosting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: viewer.id, content })
      .select('id, user_id, post_id, content, created_at')
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, { ...data, author: viewer }]);
      setCount((c) => c + 1);
      setDraft('');
    }
    setPosting(false);
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== id));
      setCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-sm text-parchment-muted transition-colors hover:text-parchment"
        aria-expanded={open}
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3.75h6M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3 12c0 1.6.42 3.1 1.15 4.4L3 21l4.6-1.15A9 9 0 0021 12"
          />
        </svg>
        <span className="tabular-nums">{count}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 border-t border-ink-800 pt-4 animate-fade-in">
          {loading && (
            <p className="text-sm text-parchment-dim">{t('commentsTitle')}…</p>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-sm text-parchment-dim">{t('noComments')}</p>
          )}

          <ul className="space-y-4">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Link href={`/profile/${c.author.username}`} className="shrink-0">
                  <Avatar
                    name={c.author.display_name}
                    url={c.author.avatar_url}
                    size="sm"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${c.author.username}`}
                      className="text-sm font-medium text-parchment hover:text-accent"
                    >
                      {c.author.display_name}
                    </Link>
                    <span className="text-xs text-parchment-dim">
                      @{c.author.username}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-parchment-muted">
                    {c.content}
                  </p>
                </div>
                {viewer?.id === c.user_id && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={t('deleteComment')}
                    className="shrink-0 text-parchment-dim transition-colors hover:text-red-400"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0l.5 12a1 1 0 001 1h5a1 1 0 001-1L16 7"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>

          {viewer ? (
            <form onSubmit={submit} className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, LIMITS.commentMaxChars))}
                placeholder={t('commentPlaceholder')}
                rows={2}
                className="input resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-parchment-dim tabular-nums">
                  {draft.length}/{LIMITS.commentMaxChars}
                </span>
                <button
                  type="submit"
                  disabled={posting || !draft.trim()}
                  className="btn-primary"
                >
                  {posting ? t('posting') : t('postComment')}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-parchment-dim">
              <Link href="/login" className="text-accent hover:underline">
                {t('loginToComment')}
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
