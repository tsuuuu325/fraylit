'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { LIMITS } from '@/lib/validation';
import type { Profile } from '@/lib/types';
import Avatar from './Avatar';

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export default function EditProfile({ profile }: { profile: Profile }) {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(t('edit.avatarInvalidType'));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setUploadError(t('edit.avatarTooLarge'));
      return;
    }

    setUploadError(null);
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadErr) {
      setUploadError(t('edit.avatarUploadFailed'));
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(`${data.publicUrl}?v=${Date.now()}`);
    setUploading(false);
  }

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
                <div className="flex items-center gap-3">
                  <Avatar name={displayName} url={avatarUrl} size="md" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-outline"
                  >
                    {uploading ? tc('saving') : t('edit.avatarChoose')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarSelected}
                    className="hidden"
                  />
                </div>
                {uploadError && (
                  <p className="mt-1 text-sm text-red-400">{uploadError}</p>
                )}
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
