import { VerifyEmail } from '@/components/verify-email';
import { getPreferences } from '@/lib/server-prefs';

export const metadata = { title: 'Verify e-mail' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  const { dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">{dict.verifyEmail}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.verificationRequired}</p>
      </div>
      <VerifyEmail dict={dict} token={query.token ?? ''} />
    </div>
  );
}
