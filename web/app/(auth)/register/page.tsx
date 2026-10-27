import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/register-form';
import { getPreferences } from '@/lib/server-prefs';
import { getSessionUser } from '@/lib/session.server';

export const metadata = { title: 'Create account' };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect('/dashboard');
  const { dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dict.createAccount}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.registerSubtitle}</p>
      </div>
      <RegisterForm dict={dict} />
    </div>
  );
}
