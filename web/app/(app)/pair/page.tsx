import { PageHeader } from '@/components/ui/feedback';
import { PairPanel } from '@/components/pair-panel';
import { getPreferences } from '@/lib/server-prefs';
import { requireUser } from '@/lib/session.server';

export const metadata = { title: 'Pair a device' };

export default async function PairPage() {
  await requireUser();
  const { dict } = await getPreferences();

  return (
    <div className="space-y-6">
      <PageHeader title={dict.pairTitle} description={dict.pairSubtitle} />
      <PairPanel dict={dict} />
    </div>
  );
}
