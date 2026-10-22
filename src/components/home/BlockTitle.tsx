/**
 * "EVERYDAY LEVERAGE" as ANSI block art: a 5×7 pixel face drawn cell by cell, cyan blocks over a
 * magenta shade one cell down and right. Rows arrive one at a time, like a title screen coming in over a
 * modem. Decorative: the heading's text is given separately to assistive tech.
 */
const GLYPHS: Record<string, string[]> = {
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
};

const WORDS = ['EVERYDAY', 'LEVERAGE'];
const ROW_GAP = 2;
const COLS = WORDS[0].length * 6 - 1;
const ROWS = WORDS.length * 7 + (WORDS.length - 1) * ROW_GAP;

/** Filled cells as [x, y], row-major. */
function cells(): [number, number][] {
  const out: [number, number][] = [];
  WORDS.forEach((w, wi) => {
    const y0 = wi * (7 + ROW_GAP);
    [...w].forEach((ch, ci) => {
      GLYPHS[ch].forEach((row, ry) => {
        [...row].forEach((c, rx) => {
          if (c === '#') out.push([ci * 6 + rx, y0 + ry]);
        });
      });
    });
  });
  return out;
}

const CELLS = cells();
const rows = Array.from({ length: ROWS }, (_, y) => CELLS.filter((c) => c[1] === y));

export function BlockTitle({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${COLS + 1} ${ROWS + 1}`}
      className={className}
      aria-hidden="true"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMinYMin meet"
    >
      {rows.map((r, y) =>
        r.length ? (
          <g key={y} className="pour" style={{ animationDelay: `${120 + y * 45}ms` }}>
            {r.map(([x]) => (
              <rect key={`s${x}`} x={x + 0.35} y={y + 0.35} width={1} height={1} fill="var(--color-shade)" />
            ))}
            {r.map(([x]) => (
              <rect key={x} x={x} y={y} width={0.92} height={0.92} fill="var(--color-primary)" />
            ))}
          </g>
        ) : null,
      )}
    </svg>
  );
}
