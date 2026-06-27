import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import UpgradeButton from './UpgradeButton';

export default async function UpgradePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const t = await getTranslations('subscription');
  const profile = await getCurrentProfile();
  const isPaid = profile?.subscription_status === 'active';

  return (
    <div className="animate-fade-in mx-auto max-w-lg">
      <div className="card space-y-6 p-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-amber-400">
          {t('upgradeTitle')}
        </h1>
        <p className="text-2xl font-semibold text-parchment">{t('priceLabel')}</p>

        <ul className="space-y-2 text-left text-parchment-muted">
          <li>✦ {t('featureUnlimitedPosts')}</li>
          <li>✦ {t('featureGoldName')}</li>
          <li>✦ {t('featureGoldFrame')}</li>
        </ul>

        {isPaid ? (
          <p className="text-parchment-muted">{t('alreadySubscribed')}</p>
        ) : (
          <UpgradeButton label={t('upgradeButton')} />
        )}
      </div>
    </div>
  );
}
