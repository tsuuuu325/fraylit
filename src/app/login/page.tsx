import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import GoogleButton from '@/components/GoogleButton';
import LoginForm from './LoginForm';

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect('/');

  const { error: authError } = await searchParams;
  const t = await getTranslations('auth');

  return (
    <div className="mx-auto max-w-sm animate-fade-in">
      <div className="card p-6 sm:p-8">
        <h1 className="font-serif text-3xl font-bold">{t('login.title')}</h1>
        <p className="mt-1 text-sm text-parchment-muted">{t('login.subtitle')}</p>

        {authError === 'auth' && (
          <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {t('callbackFailed')}
          </p>
        )}

        <div className="mt-6">
          <LoginForm />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-parchment-dim">
          <span className="h-px flex-1 bg-ink-800" />
          {t('orContinueWith')}
          <span className="h-px flex-1 bg-ink-800" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-parchment-muted">
          {t('login.noAccount')}{' '}
          <Link href="/signup" className="text-accent hover:underline">
            {t('login.signupLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
