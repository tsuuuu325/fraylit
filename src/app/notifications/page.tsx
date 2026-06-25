import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, getFormatter } from 'next-intl/server';
import { getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getNotifications, markAllNotificationsRead } from '@/lib/queries';
import Avatar from '@/components/Avatar';

export default async function NotificationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const t = await getTranslations('notifications');
  const format = await getFormatter();
  const supabase = await createClient();

  const items = await getNotifications(supabase, profile.id, 50);
  await markAllNotificationsRead(supabase, profile.id);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-parchment-muted">{t('subtitle')}</p>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-parchment-muted">{t('empty')}</p>
        </div>
      ) : (
        <ul className="card divide-y divide-ink-800">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href="/"
                className="flex gap-4 px-5 py-4 transition-colors hover:bg-ink-800/50 sm:px-6"
              >
                <Avatar
                  name={n.actor.display_name}
                  url={n.actor.avatar_url}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-parchment">
                    {n.type === 'like'
                      ? t('liked', { name: n.actor.display_name })
                      : t('commented', { name: n.actor.display_name })}
                  </p>
                  <p className="mt-1 text-xs text-parchment-dim">
                    {format.relativeTime(new Date(n.created_at), Date.now())}
                  </p>
                </div>
                <span className="shrink-0 self-center text-parchment-dim">
                  {n.type === 'like' ? '♥' : '◦'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
