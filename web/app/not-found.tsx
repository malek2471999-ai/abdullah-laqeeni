import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';

export const metadata = { title: 'Not found' };

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-card">
        <BrandMark className="mx-auto h-12 w-12" />
        <span className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Compass className="h-5 w-5" />
        </span>
        <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-brand">404</p>
        <h1 className="mt-2 text-xl font-bold">Not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This page does not exist. الصفحة غير موجودة. Page introuvable.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand/90"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
