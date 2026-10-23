import type { ReactNode } from 'react';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok border-[#b9dcc6]',
  warn: 'bg-warn-bg text-warn border-[#e2cfa6]',
  bad: 'bg-bad-bg text-bad border-bad',
  info: 'bg-info-bg text-info border-info',
  neutral: 'bg-surface-2 text-text border-border',
};

export function Badge({
  tone = 'neutral',
  children,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-sm font-medium leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
