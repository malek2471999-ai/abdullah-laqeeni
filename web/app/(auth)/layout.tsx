import Link from 'next/link';
import { ArrowLeft, CheckCircle2, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { PreferenceSwitcher } from '@/components/preference-switcher';
import { getPreferences } from '@/lib/server-prefs';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale, theme, dict } = await getPreferences();

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-hero-glow opacity-80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 grid-pattern opacity-30"
          aria-hidden
        />
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-base font-bold">{dict.appName}</p>
            <p className="text-xs text-white/60">{dict.slogan}</p>
          </div>
        </Link>

        <div className="relative z-10 my-auto max-w-md py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint" />
            {dict.heroBadge}
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight">
            {dict.heroTitle}
            <span className="mt-2 block bg-gradient-to-r from-brand via-violet to-mint bg-clip-text text-transparent">
              {dict.heroTitleAccent}
            </span>
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/70">{dict.heroText}</p>

          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              { icon: MapPin, text: dict.featureLocationText },
              { icon: LockKeyhole, text: dict.featureSecurityText },
              { icon: ShieldCheck, text: dict.privacyTitle },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-4 w-4 text-mint" />
                  </span>
                  <span className="leading-6">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative z-10 max-w-md rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-5 text-white/60">
          {dict.disclaimer}
        </p>
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark className="h-9 w-9 rounded-xl" />
            <span className="text-sm font-bold">{dict.appName}</span>
          </Link>
          <div className="w-[136px]">
            <PreferenceSwitcher locale={locale} theme={theme} dict={dict} compact />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                {dict.appName}
              </Link>
              <div className="hidden w-[136px] lg:block">
                <PreferenceSwitcher locale={locale} theme={theme} dict={dict} compact />
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
              {children}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-mint" />
              {dict.deviceLimit}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
