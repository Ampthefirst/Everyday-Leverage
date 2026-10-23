import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border border-border bg-surface p-6 ${className}`}>{children}</section>
  );
}

export function PageHeader({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <header className="mb-6 space-y-2">
      <h1 className="text-[2.6rem] sm:text-[3.2rem]">{title}</h1>
      {lead && <p className="max-w-[36em] text-lg text-muted">{lead}</p>}
    </header>
  );
}

export function Page({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  // Every page shares the header's left edge; narrow pages keep a readable measure from it.
  return (
    <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-24 lg:py-16">
      <div className={narrow ? 'max-w-3xl' : ''}>{children}</div>
    </div>
  );
}

export function Note({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'bad' | 'ok';
  children: ReactNode;
}) {
  const cls = {
    info: 'border-[#cfd7f2] bg-info-bg',
    warn: 'border-[#e2cfa6] bg-warn-bg',
    bad: 'border-[#e3b4ae] bg-bad-bg',
    ok: 'border-[#b9dcc6] bg-ok-bg',
  }[tone];
  return <div className={`rounded-md border p-4 ${cls}`}>{children}</div>;
}
