import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  MapPin,
  Radio,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { PreferenceSwitcher } from '@/components/preference-switcher';
import { StatusDot } from '@/components/ui/badge';
import { getSessionUser } from '@/lib/session.server';
import { getPreferences } from '@/lib/server-prefs';

export default async function LandingPage() {
  const user = await getSessionUser();
  const { locale, theme, dict } = await getPreferences();

  const features = [
    {
      icon: MapPin,
      title: dict.featureLocationTitle,
      text: dict.featureLocationText,
      tone: 'text-brand',
      ring: 'bg-brand/10',
    },
    {
      icon: BellRing,
      title: dict.featureAlarmTitle,
      text: dict.featureAlarmText,
      tone: 'text-danger',
      ring: 'bg-danger/10',
    },
    {
      icon: Smartphone,
      title: dict.featureLostTitle,
      text: dict.featureLostText,
      tone: 'text-violet',
      ring: 'bg-violet/10',
    },
    {
      icon: ShieldCheck,
      title: dict.featureSecurityTitle,
      text: dict.featureSecurityText,
      tone: 'text-mint',
      ring: 'bg-mint/10',
    },
  ];

  const steps = [
    { icon: Smartphone, title: dict.stepOneTitle, text: dict.stepOneText },
    { icon: Radio, title: dict.stepTwoTitle, text: dict.stepTwoText },
    { icon: MapPin, title: dict.stepThreeTitle, text: dict.stepThreeText },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-hero-glow" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-pattern opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />

      <header className="relative z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="h-9 w-9 rounded-xl" />
            <span className="truncate text-sm font-bold sm:text-base">{dict.appName}</span>
          </Link>
          <nav className="ms-6 hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">
              {dict.featureLocationTitle}
            </a>
            <a href="#how" className="transition hover:text-foreground">
              {dict.howTitle}
            </a>
            <a href="#privacy" className="transition hover:text-foreground">
              {dict.privacyTitle}
            </a>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div className="hidden w-[132px] sm:block">
              <PreferenceSwitcher locale={locale} theme={theme} dict={dict} compact />
            </div>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                {dict.dashboard}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-9 items-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
                >
                  {dict.login}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(8,124,255,0.9)] transition hover:bg-brand/90"
                >
                  {dict.getStarted}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {dict.heroBadge}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {dict.heroTitle}
              <span className="mt-2 block bg-gradient-to-r from-brand via-violet to-mint bg-clip-text text-transparent">
                {dict.heroTitleAccent}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {dict.heroText}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={user ? '/dashboard' : '/register'}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-base font-semibold text-white shadow-[0_18px_40px_-18px_rgba(8,124,255,0.95)] transition hover:bg-brand/90"
              >
                {user ? dict.dashboard : dict.getStarted}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                href={user ? '/pair' : '/login'}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card/60 px-6 text-base font-semibold transition hover:bg-muted"
              >
                <Smartphone className="h-4 w-4" />
                {user ? dict.pairDevice : dict.login}
              </Link>
            </div>
            <ul className="mt-8 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
              {[dict.deviceLimit, dict.privacyTitle, dict.dataRetention, dict.featureSecurityTitle].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-mint" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="absolute -inset-6 rounded-[42px] bg-brand-gradient opacity-20 blur-2xl" aria-hidden />
            <div className="relative mx-auto w-full max-w-[380px] rounded-[36px] border border-border/80 bg-card p-4 shadow-card">
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-muted" />
              <div className="overflow-hidden rounded-[26px] border border-border bg-background">
                <div className="relative h-44 overflow-hidden bg-[#0b213b] grid-pattern">
                  <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-navy/60" />
                  <div className="absolute start-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-glow pulse-dot">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                    <span className="rounded-full bg-navy/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                      {dict.lastKnownLocation}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[10px] font-semibold text-mint backdrop-blur">
                      <StatusDot online />
                      {dict.online}
                    </span>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-xl bg-navy/75 px-3 py-2 text-[10px] text-white/80 backdrop-blur">
                    <span>31.9539, 35.9106</span>
                    <span dir="ltr">± 12 m</span>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">{dict.appName}</p>
                      <p className="text-[11px] text-muted-foreground">{dict.lastSeen} · {dict.live}</p>
                    </div>
                    <span className="rounded-full border border-mint/25 bg-mint/10 px-2 py-0.5 text-[10px] font-semibold text-mint">
                      {dict.battery} 82%
                    </span>
                  </div>

                  <button
                    type="button"
                    tabIndex={-1}
                    className="flex w-full items-center justify-between rounded-2xl border border-danger/30 bg-danger/10 px-3.5 py-3 text-start"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger text-white">
                        <BellRing className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-danger">{dict.ring}</span>
                        <span className="block text-[10px] text-danger/70">{dict.ringDescription}</span>
                      </span>
                    </span>
                    <Radio className="h-4 w-4 animate-pulse text-danger" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {dict.network}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">Wi-Fi · {dict.online}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {dict.lostDevices}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">{dict.no}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 start-0 hidden items-center gap-2 rounded-2xl border border-border bg-card/90 px-3.5 py-2.5 shadow-card backdrop-blur sm:flex">
              <LockKeyhole className="h-4 w-4 text-mint" />
              <div>
                <p className="text-[11px] font-semibold">{dict.featureSecurityTitle}</p>
                <p className="text-[10px] text-muted-foreground">{dict.twoFactor}</p>
              </div>
            </div>
            <div className="absolute -top-4 end-0 hidden items-center gap-2 rounded-2xl border border-border bg-card/90 px-3.5 py-2.5 shadow-card backdrop-blur sm:flex">
              <WifiOff className="h-4 w-4 text-violet" />
              <div>
                <p className="text-[11px] font-semibold">{dict.offlineWarning}</p>
                <p className="text-[10px] text-muted-foreground">{dict.offlineWarningText.slice(0, 38)}…</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-border/60 bg-card/40 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{dict.howTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{dict.tagline}</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30"
                  >
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${feature.ring} ${feature.tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                {dict.howTitle}
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {dict.stepOneTitle} · {dict.stepTwoTitle} · {dict.stepThreeTitle}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                {dict.heroText}
              </p>
              <Link
                href={user ? '/pair' : '/register'}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                {dict.getStarted}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
            <ol className="space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-card"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </p>
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section id="privacy" className="border-t border-border/60 bg-card/40 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-mint/25 bg-mint/5 p-6 sm:p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-mint">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-bold">{dict.privacyTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{dict.privacyText}</p>
              <p className="mt-4 rounded-xl border border-border bg-background/60 p-3 text-xs leading-6 text-muted-foreground">
                {dict.disclaimer}
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-3xl border border-border bg-card p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">
                {dict.slogan}
              </p>
              <p className="mt-3 text-xl font-bold leading-8 sm:text-2xl">
                {dict.heroTitle} {dict.heroTitleAccent}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[dict.twoFactor, dict.deviceLimit, dict.dataRetention, dict.privacyTitle].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={user ? '/dashboard' : '/register'}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand/90"
                >
                  {user ? dict.dashboard : dict.getStarted}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-semibold transition hover:bg-muted"
                >
                  {dict.login}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 rounded-xl" />
            <div>
              <p className="text-sm font-bold">{dict.appName}</p>
              <p className="text-xs text-muted-foreground">{dict.slogan}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              {dict.login}
            </Link>
            <Link href="/register" className="hover:text-foreground">
              {dict.register}
            </Link>
            <Link href="/security" className="hover:text-foreground">
              {dict.security}
            </Link>
            <span>
              © {new Date().getFullYear()} {dict.appName}. {dict.footerRights}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
