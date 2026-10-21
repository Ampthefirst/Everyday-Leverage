import type { ReactNode } from 'react';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

const tones: Record<Tone, string> = {
  ok: 'bg-ok-bg text-ok border-ok',
  warn: 'bg-warn-bg text-warn border-warn',
  bad: 'bg-bad-bg text-bad border-bad',
  info: 'bg-info-bg text-info border-info',
  neutral: 'bg-surface-2 text-text border-border',
};

export function Badge({ tone = 'neutral', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
