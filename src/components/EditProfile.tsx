'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LIMITS } from '@/lib/validation';
import type { Profile } from '@/lib/types';

export default function EditProfile({ profile }: { profile: Profile }) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim().slice(0, LIMITS.displayNameMaxChars) || profile.username,
        bio: bio.trim() ? bio.trim().slice(0, LIMITS.bioMaxChars) : null,
        avatar_url: avatarUrl.trim() || null
      })
      .eq('id', profile.id);

    setSaving(false);
    if (!error) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-outline">
        {t('editProfile')}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card w-full max-w-md p-6">
            <h2 className="font-serif text-2xl font-bold">{t('edit.title')}</h2>

            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm text-parchment-muted">
                  {t('edit.displayNameLabel')}
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={LIMITS.displayNameMaxChars}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-parchment-muted">
                  {t('edit.bioLabel')}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) =>
                    setBio(e.target.value.slice(0, LIMITS.bioMaxChars))
                  }
                  placeholder={t('edit.bioPlaceholder')}
                  rows={3}
                  className="input resize-none"
                />
                <p className="mt-1 text-right text-xs text-parchment-dim tabular-nums">
                  {bio.length}/{LIMITS.bioMaxChars}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm text-parchment-muted">
                  {t('edit.avatarUrlLabel')}
                </label>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder={t('edit.avatarUrlPlaceholder')}
                  className="input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-ghost"
                >
                  {tc('cancel')}
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? tc('saving') : t('edit.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
