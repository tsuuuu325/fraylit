import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import CreatePostForm from './CreatePostForm';

export default async function CreatePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const t = await getTranslations('create');

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-parchment-muted">{t('subtitle')}</p>
      </div>
      <CreatePostForm userId={user.id} />
    </div>
  );
}
