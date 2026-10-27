'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Keeps server-rendered dashboards fresh without a websocket. Refreshes only
 * while the tab is visible to avoid pointless API load in the background.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, router]);

  return null;
}
