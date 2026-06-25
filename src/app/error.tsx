'use client';

import { useTranslations } from 'next-intl';

export default function Error({ reset }: { reset: () => void }) {
  const t = useTranslations('common');
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <p className="text-lg text-parchment-muted">{t('error')}</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        {t('retry')}
      </button>
    </div>
  );
}
