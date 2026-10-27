'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/brand-mark';

const copy = {
  en: {
    title: 'Something went wrong',
    text: 'The page could not be loaded. Check your connection and try again.',
    retry: 'Try again',
    home: 'Back to dashboard',
  },
  ar: {
    title: 'حدث خطأ ما',
    text: 'تعذّر تحميل الصفحة. تحقّق من اتصالك ثم حاول مرة أخرى.',
    retry: 'إعادة المحاولة',
    home: 'العودة إلى اللوحة',
  },
  fr: {
    title: 'Une erreur est survenue',
    text: "La page n'a pas pu être chargée. Vérifiez votre connexion et réessayez.",
    retry: 'Réessayer',
    home: 'Retour au tableau de bord',
  },
} as const;

type Lang = keyof typeof copy;

export function RouteError({ reset }: { reset: () => void }) {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const value = document.documentElement.lang;
    if (value === 'ar' || value === 'fr') setLang(value);
  }, []);

  const t = copy[lang];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <BrandMark className="mx-auto h-12 w-12" />
        <span className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h1 className="mt-3 text-xl font-bold">{t.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.text}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            {t.retry}
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted"
          >
            {t.home}
          </Link>
        </div>
      </div>
    </div>
  );
}
