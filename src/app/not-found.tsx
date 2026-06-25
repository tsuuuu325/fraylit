import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('nav');
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <p className="font-serif text-5xl font-bold text-accent">404</p>
      <Link href="/" className="btn-primary mt-6">
        {t('home')}
      </Link>
    </div>
  );
}
