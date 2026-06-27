import type { Metadata } from 'next';
import { getTranslations, getFormatter } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getProfileByUsername, getPostsByUser } from '@/lib/queries';
import PostCard from '@/components/PostCard';
import Avatar from '@/components/Avatar';
import EditProfile from '@/components/EditProfile';
import type { PostAuthor } from '@/lib/types';

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const t = await getTranslations('profile');
  const format = await getFormatter();
  const supabase = await createClient();

  const profile = await getProfileByUsername(supabase, username);

  if (!profile) {
    return (
      <div className="card p-10 text-center">
        <p className="text-lg text-parchment-muted">{t('notFound')}</p>
      </div>
    );
  }

  const me = await getCurrentProfile();
  const viewer: PostAuthor | null = me
    ? {
        id: me.id,
        username: me.username,
        display_name: me.display_name,
        avatar_url: me.avatar_url,
        is_paid: me.subscription_status === 'active'
      }
    : null;
  const isOwner = me?.id === profile.id;
  const isPaid = profile.subscription_status === 'active';

  const posts = await getPostsByUser(supabase, profile.id, viewer?.id ?? null);

  return (
    <div className="animate-fade-in">
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <Avatar
          name={profile.display_name}
          url={profile.avatar_url}
          size="lg"
          isPaid={isPaid}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1
                className={`font-serif text-3xl font-bold ${
                  isPaid ? 'gold-text' : ''
                }`}
              >
                {profile.display_name}
              </h1>
              <p className="text-parchment-dim">@{profile.username}</p>
            </div>
            {isOwner && <EditProfile profile={profile} />}
          </div>

          {profile.bio && (
            <p className="mt-3 whitespace-pre-wrap text-parchment-muted">
              {profile.bio}
            </p>
          )}
          <p className="mt-2 text-xs text-parchment-dim">
            {t('memberSince', {
              date: format.dateTime(new Date(profile.created_at), {
                year: 'numeric',
                month: 'long'
              })
            })}
          </p>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-parchment-dim">
          {t('postsTitle')}
        </h2>

        {posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-parchment-muted">{t('noPosts')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} viewer={viewer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
