import type { FamilyId } from '../families/types';

/** Small line pictograms for each sub-family. Decorative. */
export function FamilyIcon({ id, className = 'h-14 w-14' }: { id: FamilyId; className?: string }) {
  const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const shapes: Record<FamilyId, React.ReactNode> = {
    A1: (
      <>
        <rect x={22} y={10} width={20} height={44} rx={10} {...s} />
        <path d="M32 2 v8 M32 54 v8" {...s} />
      </>
    ),
    A2: (
      <>
        <ellipse cx={32} cy={30} rx={22} ry={12} {...s} />
        <path d="M8 46 h48" {...s} />
      </>
    ),
    A3: (
      <>
        <rect x={8} y={10} width={48} height={14} rx={7} {...s} />
        <path d="M32 24 v30" {...s} />
      </>
    ),
    B1: (
      <>
        <circle cx={22} cy={32} r={14} {...s} />
        <path d="M36 32 h22" {...s} strokeWidth={8} />
      </>
    ),
    B2: (
      <>
        <rect x={6} y={24} width={52} height={14} rx={7} {...s} />
        <path d="M32 38 v20" {...s} />
      </>
    ),
    B3: (
      <>
        <path d="M22 18 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" {...s} />
        <path d="M36 32 h22" {...s} strokeWidth={8} />
      </>
    ),
    C1: (
      <>
        <rect x={10} y={18} width={44} height={26} rx={13} {...s} />
        <path d="M32 44 v14" {...s} />
      </>
    ),
    C2: (
      <>
        <path d="M6 32 h20" {...s} strokeWidth={10} />
        <path d="M26 32 h26" {...s} />
        <circle cx={56} cy={32} r={4} {...s} />
      </>
    ),
    C3: (
      <>
        <circle cx={10} cy={36} r={6} {...s} />
        <path d="M16 36 h34 a8 8 0 0 0 8 -8 v-6" {...s} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {shapes[id]}
    </svg>
  );
}
