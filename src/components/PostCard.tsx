'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { PostAuthor, PostWithMeta } from '@/lib/types';
import Avatar from './Avatar';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import ViewCounter from './ViewCounter';

function PostBody({ post }: { post: PostWithMeta }) {
  const t = useTranslations('post');

  if (post.mode === 'plot_twist') {
    return (
      <p className="literary text-xl sm:text-2xl">{post.twist_lines}</p>
    );
  }

  return (
    <div className="space-y-5">
      {post.opening_lines && (
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-parchment-dim">
            {t('openingLabel')}
          </p>
          <p className="literary text-xl sm:text-2xl">{post.opening_lines}</p>
        </div>
      )}
      {post.opening_lines && post.closing_lines && (
        <div className="flex items-center gap-3 text-parchment-dim">
          <span className="h-px flex-1 bg-ink-800" />
          <span aria-hidden>✦</span>
          <span className="h-px flex-1 bg-ink-800" />
        </div>
      )}
      {post.closing_lines && (
        <div>
          <p className="mb-1 text-xs uppercase tracking-widest text-parchment-dim">
            {t('closingLabel')}
          </p>
          <p className="literary text-xl sm:text-2xl">{post.closing_lines}</p>
        </div>
      )}
    </div>
  );
}

export default function PostCard({
  post,
  viewer
}: {
  post: PostWithMeta;
  viewer: PostAuthor | null;
}) {
  const t = useTranslations('post');
  const format = useFormatter();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [removed, setRemoved] = useState(false);

  const isOwner = viewer?.id === post.user_id;
  const modeLabel =
    post.mode === 'plot_twist'
      ? t('modePlotTwist')
      : t('modeOpeningClosing');

  async function onDelete() {
    if (!window.confirm(t('deleteConfirm'))) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      setDeleting(false);
      return;
    }
    setRemoved(true);
    router.refresh();
  }

  if (removed) return null;

  return (
    <article className="card animate-fade-in p-5 sm:p-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className={`badge ${
            post.mode === 'plot_twist'
              ? 'bg-accent/15 text-accent-soft'
              : 'bg-ink-700 text-parchment-muted'
          }`}
        >
          {modeLabel}
        </span>

        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={t('deletePost')}
            className="text-parchment-dim transition-colors hover:text-red-400 disabled:opacity-50"
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
      </div>

      <PostBody post={post} />

      <div className="mt-6 flex items-center justify-between gap-4">
        <Link
          href={`/profile/${post.author.username}`}
          className="group flex items-center gap-2.5"
        >
          <Avatar
            name={post.author.display_name}
            url={post.author.avatar_url}
            size="sm"
            isPaid={post.author.is_paid}
          />
          <span className="min-w-0">
            <span
              className={`block truncate text-sm font-medium group-hover:text-accent ${
                post.author.is_paid ? 'text-amber-400' : 'text-parchment'
              }`}
            >
              {post.author.display_name}
            </span>
            <span className="block truncate text-xs text-parchment-dim">
              {format.dateTime(new Date(post.created_at), {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <ViewCounter postId={post.id} initialCount={post.view_count} />
          <LikeButton
            postId={post.id}
            initialCount={post.like_count}
            initialLiked={post.liked_by_me}
            viewerId={viewer?.id ?? null}
          />
        </div>
      </div>

      <div className="mt-4">
        <CommentSection
          postId={post.id}
          initialCount={post.comment_count}
          viewer={viewer}
        />
      </div>
    </article>
  );
}
