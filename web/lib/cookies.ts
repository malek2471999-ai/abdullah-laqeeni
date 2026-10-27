export const ACCESS_COOKIE = 'laqeeni_access';
export const REFRESH_COOKIE = 'laqeeni_refresh';
export const LOCALE_COOKIE = 'laqeeni_locale';
export const THEME_COOKIE = 'laqeeni_theme';

export const isProduction = process.env.NODE_ENV === 'production';

export const accessCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
  maxAge: 60 * 60 * 12,
};

export const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
  maxAge: 30 * 24 * 60 * 60,
};

export const preferenceCookieOptions = {
  httpOnly: false,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
  maxAge: 365 * 24 * 60 * 60,
};
