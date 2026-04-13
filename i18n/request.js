import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

const SUPPORTED_LOCALES = ['en', 'hi'];
const DEFAULT_LOCALE = 'en';

export default getRequestConfig(async () => {
  // Read locale from cookie (set by LanguageSwitcher component)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale')?.value;
  const locale = SUPPORTED_LOCALES.includes(localeCookie) ? localeCookie : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
