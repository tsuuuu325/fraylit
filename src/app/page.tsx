import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getTimeline } from '@/lib/queries';
import PostCard from '@/components/PostCard';
import type { PostAuthor, PostWithMeta } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function TimelinePage() {
  const t = await getTranslations('timeline');
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const viewer: PostAuthor | null = profile
    ? {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        is_paid: profile.subscription_status === 'active'
      }
    : null;

  let posts: PostWithMeta[] = [];
  let failed = false;
  let errorDetail: string | undefined;
  try {
    posts = await getTimeline(supabase, viewer?.id ?? null);
  } catch (err) {
    console.error('[Timeline]', err);
    failed = true;
    errorDetail =
      err instanceof Error ? err.message : 'Unknown error loading posts.';
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-2 text-parchment-muted">{t('subtitle')}</p>
      </div>

      {failed ? (
        <ErrorState detail={errorDetail} />
      ) : posts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} viewer={viewer} />
          ))}
        </div>
      )}
    </div>
  );
}

async function EmptyState() {
  const t = await getTranslations('timeline');
  const tn = await getTranslations('nav');
  return (
    <div className="card p-10 text-center">
      <p className="text-lg text-parchment-muted">{t('empty')}</p>
      <p className="mt-1 text-sm text-parchment-dim">{t('emptyCta')}</p>
      <Link href="/create" className="btn-primary mt-6">
        {tn('create')}
      </Link>
    </div>
  );
}

async function ErrorState({ detail }: { detail?: string }) {
  const t = await getTranslations('common');
  return (
    <div className="card p-10 text-center">
      <p className="text-lg text-parchment-muted">{t('error')}</p>
      {process.env.NODE_ENV === 'development' && detail && (
        <p className="mt-3 break-words text-xs text-parchment-dim">{detail}</p>
      )}
    </div>
  );
}
