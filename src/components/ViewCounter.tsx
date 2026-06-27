'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

const SESSION_KEY = 'fraylit_viewed_posts';

function alreadyViewed(postId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(postId);
  } catch {
    return false;
  }
}

function markViewed(postId: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    if (!ids.includes(postId)) {
      ids.push(postId);
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids));
    }
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
}

export default function ViewCounter({
  postId,
  initialCount
}: {
  postId: string;
  initialCount: number;
}) {
  const t = useTranslations('post');
  const [count, setCount] = useState(initialCount);
  const ref = useRef<HTMLSpanElement>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || countedRef.current) return;
    if (alreadyViewed(postId)) return;

    const record = () => {
      if (countedRef.current) return;
      countedRef.current = true;
      markViewed(postId);
      setCount((c) => c + 1);
      void createClient().rpc('increment_post_views', { p_id: postId });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            record();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [postId]);

  return (
    <span
      ref={ref}
      className="inline-flex items-center gap-1.5 text-sm text-parchment-muted"
      aria-label={t('views')}
      title={t('views')}
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
          d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12 18 19.5 12 19.5 2.25 12 2.25 12z"
        />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
