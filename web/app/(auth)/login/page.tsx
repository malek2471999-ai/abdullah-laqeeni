import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { getPreferences } from '@/lib/server-prefs';
import { getSessionUser } from '@/lib/session.server';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const query = await searchParams;
  const user = await getSessionUser();
  if (user) redirect('/dashboard');
  const { dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dict.welcomeBack}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.loginSubtitle}</p>
      </div>
      <LoginForm
        dict={dict}
        googleClientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        expired={query.expired === '1'}
      />
    </div>
  );
}
