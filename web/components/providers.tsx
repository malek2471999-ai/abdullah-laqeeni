'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4800);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-6 sm:bottom-6 sm:items-end"
      >
        {items.map((item) => {
          const Icon =
            item.tone === 'success' ? CheckCircle2 : item.tone === 'error' ? XCircle : Info;
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-card animate-fade-up',
                item.tone === 'success' && 'border-mint/30 bg-card text-foreground',
                item.tone === 'error' && 'border-danger/30 bg-card text-foreground',
                item.tone === 'info' && 'border-brand/30 bg-card text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  item.tone === 'success' && 'text-mint',
                  item.tone === 'error' && 'text-danger',
                  item.tone === 'info' && 'text-brand',
                )}
              />
              <p className="flex-1 leading-6">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
