export interface FailureCase {
  id: string;
  where: string;
  cause: string;
  fix: string;
  concept: string;
}

/** "Why did it fail?" — pick where it cracked; get the likely cause, the fix and the idea behind it. */
export const FAILURES: FailureCase[] = [
  {
    id: 'layers',
    where: 'It split cleanly along a layer line',
    cause:
      'The load pulled the layers apart. Printed parts are weakest across layers — often only half as strong.',
    fix: 'Reprint it in the recommended placement (Print tab), so the main load runs along the layers. PETG bonds layers better than PLA.',
    concept: 'Layer direction',
  },
  {
    id: 'root',
    where: 'It snapped where the lever or bar meets the rest',
    cause:
      'Bending is greatest at the root of a lever, and a sharp corner there concentrates the stress even more.',
    fix: 'Use a thicker lever (thickness matters more than width), a larger fillet, more walls, or a shorter lever.',
    concept: 'Bending moment and stress concentration',
  },
  {
    id: 'socket',
    where: 'It cracked at the socket, slot or cup',
    cause: 'The corners of a shaped socket concentrate stress, and repeated twisting fatigues the plastic.',
    fix: 'Make the socket deeper and the wall thicker; add walls. For things turned every day, choose PETG.',
    concept: 'Bearing stress and fatigue',
  },
  {
    id: 'thin',
    where: 'It broke at a thin wall or groove',
    cause: 'The wall was thinner than the shell the printer can make solid, or a groove cut too deep.',
    fix: 'Increase the outer size or use shallower grooves. Keep walls at least two line widths (about 1 mm) — the app designs for 2 mm.',
    concept: 'Shell thickness',
  },
  {
    id: 'hole',
    where: 'It tore out at a strap slot or hole',
    cause: 'Too little material between the hole and the edge.',
    fix: 'Use a thicker band or move holes further from edges.',
    concept: 'Tear-out',
  },
  {
    id: 'bent',
    where: "It bent or drooped but didn't break",
    cause: 'Plastic softens with heat, and PLA slowly creeps under a steady load.',
    fix: 'Keep it away from heat (dishwasher, hot car, stove). Use PETG, and avoid leaving weight hanging on it.',
    concept: 'Heat and creep',
  },
  {
    id: 'slip',
    where: 'It slipped instead of breaking',
    cause: 'Not enough friction or grip between the aid and the object.',
    fix: 'Use the clamp version, tighter clearance, teeth or a rubber band in the cup.',
    concept: 'Friction and slip torque',
  },
];
