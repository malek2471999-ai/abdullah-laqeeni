'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Globe2, Loader2, Moon, Sun } from 'lucide-react';
import { localeNames, locales, type Dictionary, type Locale } from '@/lib/i18n';
import { LOCALE_COOKIE, THEME_COOKIE, preferenceCookieOptions } from '@/lib/cookies';
import { cn } from '@/lib/utils';

function setPreference(name: string, value: string) {
  const secure = preferenceCookieOptions.secure ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${preferenceCookieOptions.maxAge}; SameSite=Lax${secure}`;
}

export function PreferenceSwitcher({
  locale,
  theme,
  dict,
  compact,
}: {
  locale: Locale;
  theme: 'dark' | 'light';
  dict: Dictionary;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const update = (name: string, value: string) => {
    setPreference(name, value);
    setPending(true);
    router.refresh();
    window.setTimeout(() => setPending(false), 700);
  };

  return (
    <div className={cn('flex items-center gap-1.5', compact && 'text-xs')}>
      <div className="relative flex h-9 flex-1 items-center gap-1.5 rounded-xl border border-border bg-background/50 px-2">
        <Globe2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <select
          aria-label={dict.language}
          value={locale}
          onChange={(event) => update(LOCALE_COOKIE, event.target.value)}
          className="w-full appearance-none bg-transparent py-1 text-xs font-medium outline-none"
        >
          {locales.map((item) => (
            <option key={item} value={item}>
              {localeNames[item]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => update(THEME_COOKIE, theme === 'dark' ? 'light' : 'dark')}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/50 text-muted-foreground transition hover:text-foreground"
        aria-label={`${dict.theme}: ${theme === 'dark' ? dict.dark : dict.light}`}
        title={`${dict.theme}: ${theme === 'dark' ? dict.dark : dict.light}`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
