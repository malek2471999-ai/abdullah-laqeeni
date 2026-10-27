import { ResetForm } from '@/components/reset-form';
import { getPreferences } from '@/lib/server-prefs';

export const metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  const { dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dict.resetPassword}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.passwordHint}</p>
      </div>
      <ResetForm dict={dict} token={query.token ?? ''} />
    </div>
  );
}
