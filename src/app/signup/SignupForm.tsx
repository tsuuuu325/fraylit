'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSignupErrorKey } from '@/lib/auth-errors';
import { createClient } from '@/lib/supabase/client';
import { isValidUsername } from '@/lib/validation';

export default function SignupForm() {
  const t = useTranslations('auth');
  const tv = useTranslations('validation');
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isValidUsername(username)) {
      setError(tv('usernameInvalid'));
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Friendly pre-check for username availability (public read via RLS).
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (existing) {
      setError(t('signup.usernameTaken'));
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username,
          display_name: displayName || username
        }
      }
    });

    if (error) {
      setError(t(`signup.${getSignupErrorKey(error)}`));
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, a session is returned immediately.
    if (data.session) {
      router.push('/');
      router.refresh();
      return;
    }

    setNotice(t('signup.checkEmail'));
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-1 block text-sm text-parchment-muted"
        >
          {t('signup.usernameLabel')}
        </label>
        <input
          id="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('signup.usernamePlaceholder')}
          className="input"
        />
        <p className="mt-1 text-xs text-parchment-dim">
          {t('signup.usernameHint')}
        </p>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-sm text-parchment-muted"
        >
          {t('signup.displayNameLabel')}
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('signup.displayNamePlaceholder')}
          className="input"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-parchment-muted">
          {t('emailLabel')}
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="input"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm text-parchment-muted"
        >
          {t('passwordLabel')}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('passwordPlaceholder')}
          className="input"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-soft">
          {notice}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? t('signup.submitting') : t('signup.submit')}
      </button>
    </form>
  );
}
