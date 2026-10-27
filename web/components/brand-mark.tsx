import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow',
        className,
      )}
      aria-hidden
    >
      <ShieldCheck className="h-6 w-6" />
    </span>
  );
}

export default function AppIcon() {
  return <BrandMark className="h-12 w-12" />;
}
