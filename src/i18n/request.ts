import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    // Fixed time zone keeps server/client date formatting consistent
    // (prevents hydration mismatches). Change if you localize per-user.
    timeZone: 'UTC',
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
