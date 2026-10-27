'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Dictionary } from '@/lib/i18n';
import { sessionPost, ClientApiError } from '@/lib/client';
import { Button } from '@/components/ui/button';

type GoogleCredentialResponse = { credential?: string };
type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

export function GoogleButton({
  clientId,
  dict,
  onSuccess,
  onError,
}: {
  clientId: string;
  dict: Dictionary;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) return;
      setLoading(true);
      try {
        await sessionPost('google', { idToken: response.credential });
        onSuccess();
      } catch (cause) {
        if (cause instanceof ClientApiError) onError(cause.message);
        else onError(dict.genericError);
      } finally {
        setLoading(false);
      }
    },
    [dict.genericError, onError, onSuccess],
  );

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const initialise = () => {
      if (cancelled || !window.google || !container.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          void handleCredential(response);
        },
      });
      container.current.innerHTML = '';
      window.google.accounts.id.renderButton(container.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 340,
      });
      setReady(true);
    };

    if (window.google) {
      initialise();
    } else {
      const existing = document.getElementById('google-gsi');
      if (existing) {
        existing.addEventListener('load', initialise);
      } else {
        const script = document.createElement('script');
        script.id = 'google-gsi';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.addEventListener('load', initialise);
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredential]);

  return (
    <div className="relative flex min-h-11 justify-center">
      <div ref={container} className="flex justify-center" />
      {!ready ? (
        <Button variant="outline" size="lg" className="absolute inset-0 w-full" disabled>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {dict.googleSignIn}
        </Button>
      ) : null}
    </div>
  );
}
