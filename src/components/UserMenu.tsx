'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Avatar from './Avatar';
import type { Profile } from '@/lib/types';

export default function UserMenu({ profile }: { profile: Profile }) {
  const t = useTranslations('nav');
  const ts = useTranslations('subscription');
  const [open, setOpen] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isPaid = profile.subscription_status === 'active';

  async function openPortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setOpeningPortal(false);
    }
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-ink-700"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar
          name={profile.display_name}
          url={profile.avatar_url}
          size="sm"
          isPaid={isPaid}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 py-1 shadow-xl animate-fade-in"
        >
          <div className="border-b border-ink-800 px-4 py-3">
            <p
              className={`truncate text-sm font-medium ${
                isPaid ? 'gold-text' : 'text-parchment'
              }`}
            >
              {profile.display_name}
            </p>
            <p className="truncate text-xs text-parchment-dim">@{profile.username}</p>
          </div>
          <Link
            href={`/profile/${profile.username}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-parchment transition-colors hover:bg-ink-800"
            role="menuitem"
          >
            {t('profile')}
          </Link>
          <Link
            href="/create"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-parchment transition-colors hover:bg-ink-800"
            role="menuitem"
          >
            {t('create')}
          </Link>
          {isPaid ? (
            <button
              type="button"
              onClick={openPortal}
              disabled={openingPortal}
              className="block w-full px-4 py-2 text-left text-sm text-parchment transition-colors hover:bg-ink-800 disabled:opacity-50"
              role="menuitem"
            >
              {ts('manageSubscription')}
            </button>
          ) : (
            <Link
              href="/upgrade"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-ink-800"
              role="menuitem"
            >
              {ts('upgradeButton')}
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="block w-full px-4 py-2 text-left text-sm text-parchment transition-colors hover:bg-ink-800"
            role="menuitem"
          >
            {t('logout')}
          </button>
        </div>
      )}
    </div>
  );
}
