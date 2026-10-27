'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Dictionary } from '@/lib/i18n';

export function CopyButton({
  value,
  dict,
  className,
  label,
}: {
  value: string;
  dict: Dictionary;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={copy}>
      {copied ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? dict.copied : label ?? dict.copy}
    </Button>
  );
}
