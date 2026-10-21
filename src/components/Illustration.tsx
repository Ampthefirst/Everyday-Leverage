import type { IllustrationId } from '../families/types';

/** Simple line illustrations for the measuring guide. Decorative: the step text carries the meaning. */
export function Illustration({ id }: { id: IllustrationId }) {
  const stroke = 'var(--color-text)';
  const accent = 'var(--color-primary)';
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number) => (
    <g stroke={accent} strokeWidth={3} fill={accent}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <circle cx={x1} cy={y1} r={4} />
      <circle cx={x2} cy={y2} r={4} />
    </g>
  );
  let body: React.ReactNode;
  switch (id) {
    case 'shaftCaliper':
    case 'toolShank':
      body = (
        <>
          <rect x={40} y={60} width={200} height={26} rx={13} {...common} />
          <path d="M120 20 v120 M160 20 v120" {...common} />
          {arrow(120, 30, 160, 30)}
        </>
      );
      break;
    case 'shaftWrap':
      body = (
        <>
          <rect x={60} y={60} width={160} height={30} rx={15} {...common} />
          <path d="M120 50 q20 -10 20 25 q0 35 -20 25" stroke={accent} strokeWidth={4} fill="none" />
        </>
      );
      break;
    case 'handBreadth':
    case 'palmCircumference':
      body = (
        <>
          <path
            d="M80 150 v-60 q0-20 15-20 v-40 q0-10 10-10 t10 10 v40 v-50 q0-10 10-10 t10 10 v50 v-45 q0-10 10-10 t10 10 v45 v-35 q0-10 10-10 t10 10 v70 q0 40 -40 50 h-30"
            {...common}
          />
          {id === 'handBreadth' ? (
            arrow(80, 100, 175, 100)
          ) : (
            <ellipse cx={128} cy={100} rx={55} ry={14} stroke={accent} strokeWidth={4} fill="none" />
          )}
        </>
      );
      break;
    case 'lidDiameter':
    case 'knobDiameter':
      body = (
        <>
          <ellipse cx={140} cy={60} rx={80} ry={22} {...common} />
          <path d="M60 60 v50 q80 40 160 0 v-50" {...common} />
          {arrow(60, 30, 220, 30)}
        </>
      );
      break;
    case 'capProfile':
      body = (
        <>
          <path
            d="M70 80 l20 -40 l20 40 l40 0 l-30 25 l12 40 l-42 -25 l-42 25 l12 -40 l-30 -25 z"
            {...common}
          />
          <circle cx={210} cy={90} r={40} {...common} />
          <path d="M175 75 h70" stroke={accent} strokeWidth={4} />
        </>
      );
      break;
    case 'keyBlade':
      body = (
        <>
          <rect x={60} y={50} width={70} height={60} rx={14} {...common} />
          <path d="M130 70 h110 v8 h-10 v10 h-10 v-10 h-10 v10 h-80" {...common} />
          {arrow(60, 30, 130, 30)}
        </>
      );
      break;
    case 'holeSize':
      body = (
        <>
          <rect x={40} y={40} width={200} height={90} rx={8} {...common} />
          <rect x={100} y={70} width={80} height={24} rx={12} {...common} />
          {arrow(100, 110, 180, 110)}
        </>
      );
      break;
    case 'buttonSize':
      body = (
        <>
          <rect x={60} y={50} width={160} height={90} rx={10} {...common} />
          <circle cx={140} cy={95} r={22} {...common} />
          {arrow(118, 140, 162, 140)}
        </>
      );
      break;
    case 'reachDistance':
      body = (
        <>
          <path d="M30 140 h220" {...common} />
          <rect x={200} y={30} width={40} height={110} {...common} />
          {arrow(40, 90, 200, 90)}
        </>
      );
      break;
    case 'leverDiameter':
      body = (
        <>
          <circle cx={60} cy={80} r={25} {...common} />
          <rect x={60} y={68} width={180} height={24} rx={12} {...common} />
          {arrow(170, 50, 170, 110)}
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 280 170" className="h-40 w-full max-w-sm" aria-hidden="true">
      {body}
    </svg>
  );
}
