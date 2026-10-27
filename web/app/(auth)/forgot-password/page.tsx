import { ForgotForm } from '@/components/forgot-form';
import { getPreferences } from '@/lib/server-prefs';

export const metadata = { title: 'Reset password' };

export default async function ForgotPasswordPage() {
  const { dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dict.forgotPassword}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.resetSent}</p>
      </div>
      <ForgotForm dict={dict} />
    </div>
  );
}
