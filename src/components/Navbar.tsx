import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCurrentProfile } from '@/lib/auth';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

export default async function Navbar() {
  const t = await getTranslations('nav');
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-serif text-2xl font-bold tracking-tight text-parchment transition-colors hover:text-accent"
        >
          Fraylit
        </Link>

        <div className="flex items-center gap-2">
          {profile && (
            <>
              <NotificationBell userId={profile.id} />
              <Link href="/create" className="btn-outline hidden sm:inline-flex">
                {t('create')}
              </Link>
            </>
          )}

          <LanguageSwitcher />

          {profile ? (
            <UserMenu profile={profile} />
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login" className="btn-ghost">
                {t('login')}
              </Link>
              <Link href="/signup" className="btn-primary">
                {t('signup')}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
