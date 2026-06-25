import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: {
      default: `${t('appName')} — ${t('tagline')}`,
      template: `%s · ${t('appName')}`
    },
    description: t('tagline')
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable} dark`}>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
            {children}
          </main>
          <footer className="mx-auto max-w-3xl px-4 py-10 text-center text-xs text-parchment-dim">
            Fraylit
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
