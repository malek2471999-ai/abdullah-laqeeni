import Link from 'next/link';
import {
  BadgeCheck,
  Globe2,
  Info,
  LogOut,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { LogoutButton } from '@/components/logout-button';
import { PreferenceSwitcher } from '@/components/preference-switcher';
import { SignOutEverywhere } from '@/components/sign-out-everywhere';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/feedback';
import { API_INTERNAL_URL } from '@/lib/backend';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser } from '@/lib/session.server';
import packageJson from '@/package.json';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const user = await requireUser();
  const { locale, theme, dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <PageHeader title={dict.settings} description={dict.preferences} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Settings2 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.preferences}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.languageHint}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" />
                {dict.language}
              </p>
              <PreferenceSwitcher locale={locale} theme={theme} dict={dict} />
              <p className="mt-2 text-xs text-muted-foreground">{dict.languageHint}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              {dict.themeHint}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/10 text-violet">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <CardTitle>{dict.account}</CardTitle>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge tone={user.emailVerified ? 'mint' : 'violet'}>
              {user.emailVerified ? (
                <BadgeCheck className="h-3 w-3" />
              ) : (
                <Info className="h-3 w-3" />
              )}
              {user.emailVerified ? dict.emailVerified : dict.emailNotVerified}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/security"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {dict.security}
              </Link>
              <Link
                href="/pair"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
              >
                <Smartphone className="h-3.5 w-3.5" />
                {dict.pairDevice}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/10 text-mint">
              <Server className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>{dict.server}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.serverHint}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="space-y-2 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-xs text-muted-foreground">API</dt>
                <dd className="max-w-[65%] break-all text-end font-mono text-[11px]" dir="ltr">
                  {API_INTERNAL_URL}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <dt className="text-xs text-muted-foreground">{dict.deviceLimit}</dt>
                <dd className="text-xs font-semibold">10</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                <dt className="text-xs text-muted-foreground">{dict.dataRetention}</dt>
                <dd className="text-xs font-semibold">1-90 {dict.days}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-xl" />
            <div>
              <CardTitle>{dict.about}</CardTitle>
              <p className="text-xs text-muted-foreground">{dict.slogan}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm">
            <p className="text-xs leading-6 text-muted-foreground">{dict.aboutText}</p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2 text-xs">
              <span className="text-muted-foreground">{dict.version}</span>
              <span className="font-mono">{packageJson.version}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-mint/25 bg-mint/5 px-3 py-2 text-[11px] leading-5 text-mint">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              {dict.privacyTitle}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-danger/25">
        <CardHeader className="flex-row items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <LogOut className="h-5 w-5" />
          </span>
          <div>
            <CardTitle>{dict.dangerZone}</CardTitle>
            <p className="text-xs text-muted-foreground">{dict.logoutText}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">{dict.logoutText}</p>
          <div className="flex flex-wrap gap-2">
            <LogoutButton dict={dict} />
            <SignOutEverywhere dict={dict} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
