import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>{children}</section>
  );
}

export function PageHeader({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <header className="mb-6 space-y-2">
      <h1 className="text-3xl font-bold">{title}</h1>
      {lead && <p className="max-w-3xl text-lg text-muted">{lead}</p>}
    </header>
  );
}

export function Page({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <div className={`mx-auto px-4 py-8 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>{children}</div>;
}

export function Note({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'bad' | 'ok';
  children: ReactNode;
}) {
  const cls = {
    info: 'border-info bg-info-bg',
    warn: 'border-warn bg-warn-bg',
    bad: 'border-bad bg-bad-bg',
    ok: 'border-ok bg-ok-bg',
  }[tone];
  return <div className={`rounded-xl border-l-4 p-3 ${cls}`}>{children}</div>;
}
