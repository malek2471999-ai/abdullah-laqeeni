import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { getDir, getLocale } from '@/lib/i18n';
import { LOCALE_COOKIE, THEME_COOKIE } from '@/lib/cookies';
import { Providers } from '@/components/providers';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Abdullah Laqeeni — ضاع هاتفك؟ عبدالله لاقيني!',
    template: '%s · Abdullah Laqeeni',
  },
  description:
    'Consent-based phone recovery: locate, ring and protect the Android phones you own.',
  applicationName: 'Abdullah Laqeeni',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#071426',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const locale = getLocale(store.get(LOCALE_COOKIE)?.value);
  const theme = store.get(THEME_COOKIE)?.value === 'light' ? 'light' : 'dark';

  return (
    <html
      lang={locale}
      dir={getDir(locale)}
      className={theme === 'dark' ? 'dark' : ''}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
