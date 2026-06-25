'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useFormatter } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import type { NotificationWithActor } from '@/lib/types';
import Avatar from './Avatar';

export default function NotificationBell({ userId }: { userId: string }) {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationWithActor[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (!error) setUnread(count ?? 0);
  }, [userId]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `id, user_id, actor_id, post_id, type, comment_id, read_at, created_at,
         actor:profiles!notifications_actor_id_fkey ( id, username, display_name, avatar_url )`
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const rows = data.map((row) => {
        const raw = row as unknown as {
          id: string;
          user_id: string;
          actor_id: string;
          post_id: string;
          type: NotificationWithActor['type'];
          comment_id: string | null;
          read_at: string | null;
          created_at: string;
          actor:
            | NotificationWithActor['actor']
            | NotificationWithActor['actor'][]
            | null;
        };
        const a = Array.isArray(raw.actor) ? raw.actor[0] : raw.actor;
        return {
          ...raw,
          actor:
            a ?? {
              id: '',
              username: 'unknown',
              display_name: 'Unknown',
              avatar_url: null
            }
        } as NotificationWithActor;
      });
      setItems(rows);
    }
    setLoading(false);
  }, [userId]);

  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    void loadCount();
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => {
          void loadCount();
          if (openRef.current) void loadItems();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, loadCount, loadItems]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadItems();
      const supabase = createClient();
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      setUnread(0);
    }
  }

  function message(n: NotificationWithActor): string {
    return n.type === 'like'
      ? t('liked', { name: n.actor.display_name })
      : t('commented', { name: n.actor.display_name });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => void toggle()}
        className="btn-ghost relative px-2.5"
        aria-label={t('title')}
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
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-ink-950 tabular-nums">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-xl animate-fade-in sm:w-96">
          <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
            <h2 className="font-serif text-sm font-semibold text-parchment">
              {t('title')}
            </h2>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-accent hover:underline"
            >
              {t('viewAll')}
            </Link>
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {loading && (
              <li className="px-4 py-6 text-center text-sm text-parchment-dim">
                {t('loading')}
              </li>
            )}
            {!loading && items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-parchment-dim">
                {t('empty')}
              </li>
            )}
            {!loading &&
              items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      router.push('/');
                    }}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-800 ${
                      n.read_at ? '' : 'bg-accent/5'
                    }`}
                  >
                    <Link
                      href={`/profile/${n.actor.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0"
                    >
                      <Avatar
                        name={n.actor.display_name}
                        url={n.actor.avatar_url}
                        size="sm"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-parchment">{message(n)}</p>
                      <p className="mt-0.5 text-xs text-parchment-dim">
                        {format.relativeTime(new Date(n.created_at), Date.now())}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-parchment-dim"
                      aria-hidden
                    >
                      {n.type === 'like' ? '♥' : '◦'}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
