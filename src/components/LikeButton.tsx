'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
  viewerId
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  viewerId: string | null;
}) {
  const t = useTranslations('post');
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();

  async function toggle() {
    if (!viewerId) {
      router.push('/login');
      return;
    }

    // Optimistic update.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const supabase = createClient();
      let error;
      if (nextLiked) {
        ({ error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: viewerId }));
      } else {
        ({ error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', viewerId));
      }

      if (error) {
        // Revert on failure.
        setLiked(!nextLiked);
        setCount((c) => c + (nextLiked ? -1 : 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={t('like')}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        liked ? 'text-accent' : 'text-parchment-muted hover:text-parchment'
      }`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.716-4.297-9.428-7.01C.86 12.278.86 9.293 2.572 7.58a4.5 4.5 0 016.364 0L12 10.644l3.064-3.064a4.5 4.5 0 016.364 6.364C18.716 16.703 12 21 12 21z"
        />
      </svg>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
