import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import GoogleButton from '@/components/GoogleButton';
import SignupForm from './SignupForm';

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect('/');

  const t = await getTranslations('auth');

  return (
    <div className="mx-auto max-w-sm animate-fade-in">
      <div className="card p-6 sm:p-8">
        <h1 className="font-serif text-3xl font-bold">{t('signup.title')}</h1>
        <p className="mt-1 text-sm text-parchment-muted">{t('signup.subtitle')}</p>

        <div className="mt-6">
          <SignupForm />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-parchment-dim">
          <span className="h-px flex-1 bg-ink-800" />
          {t('orContinueWith')}
          <span className="h-px flex-1 bg-ink-800" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-sm text-parchment-muted">
          {t('signup.haveAccount')}{' '}
          <Link href="/login" className="text-accent hover:underline">
            {t('signup.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
