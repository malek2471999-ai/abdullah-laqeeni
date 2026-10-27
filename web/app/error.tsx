'use client';

import { RouteError } from '@/components/route-error';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError reset={reset} />;
}
