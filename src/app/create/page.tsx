import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getRecentPostCount } from '@/lib/queries';
import CreatePostForm from './CreatePostForm';

const FREE_POST_LIMIT = 2;

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const t = await getTranslations('create');
  const profile = await getCurrentProfile();
  const isPaid = profile?.subscription_status === 'active';

  const supabase = await createClient();
  const recentPostCount = isPaid ? 0 : await getRecentPostCount(supabase, user.id);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-parchment-muted">{t('subtitle')}</p>
      </div>
      <CreatePostForm
        userId={user.id}
        isPaid={isPaid}
        recentPostCount={recentPostCount}
        freeLimit={FREE_POST_LIMIT}
      />
    </div>
  );
}
