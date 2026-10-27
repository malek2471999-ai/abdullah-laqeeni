import { cookies } from 'next/headers';
import { getDictionary, getLocale, type Locale } from './i18n';
import { LOCALE_COOKIE, THEME_COOKIE } from './cookies';

export interface Preferences {
  locale: Locale;
  theme: 'dark' | 'light';
  dict: ReturnType<typeof getDictionary>;
}

export async function getPreferences(): Promise<Preferences> {
  const store = await cookies();
  const locale = getLocale(store.get(LOCALE_COOKIE)?.value);
  const theme = store.get(THEME_COOKIE)?.value === 'light' ? 'light' : 'dark';
  return { locale, theme, dict: getDictionary(locale) };
}

export function isArabicLocale(locale: Locale): boolean {
  return locale === 'ar';
}
