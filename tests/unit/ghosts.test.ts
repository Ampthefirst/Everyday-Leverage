import { describe, expect, it } from 'vitest';
import { familyList } from '../../src/families';
import type { Params } from '../../src/families/types';

/** Every preset of every design, with its ghost scene and how-to-use steps. */
const cases = familyList().flatMap((f) =>
  f.presets.map((pr) => {
    const p = f.repair({ ...f.defaults, ...pr.params } as Params);
    return { f, pr, p, ghost: f.ghost(p), anim: f.animation(p) };
  }),
);

describe('how-to-use animation and the hand', () => {
  it.each(cases.map((c) => [`${c.f.id} ${c.pr.label}`, c] as const))(
    '%s: the hand moves with the part whenever the part moves',
    (_n, { ghost, anim }) => {
      const hands = ghost.objects.flatMap((o, i) => (o.kind === 'hand' ? [i] : []));
      for (const step of anim.steps) {
        const moves = !!(step.part.translate || step.part.rotate);
        // Steps that don't list ghosts move the hands (the default); listed steps must include them.
        if (moves && step.ghosts) for (const h of hands) expect(step.ghosts).toContain(h);
      }
    },
  );
});
