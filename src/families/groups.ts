import type { FamilyGroup } from './types';

/** The three groups of designs: a short lead for indexes, and an intro on how that kind of help works. */
export const GROUPS: { id: FamilyGroup; title: string; lead: string; intro: string }[] = [
  {
    id: 'A',
    title: 'Hold',
    lead: 'Easier gripping of thin or small handles.',
    intro:
      'A thicker or better-shaped handle spreads the grip over more of the hand, so thin things take less pinch to hold.',
  },
  {
    id: 'B',
    title: 'Turn and open',
    lead: 'Twisting lids, keys, knobs, caps and taps with less force.',
    intro:
      'A lever turns a small push at its end into a big twist at the centre, so lids, keys and taps need far less grip.',
  },
  {
    id: 'C',
    title: 'Pull, push and reach',
    lead: 'Pulling, pressing and reaching without a pinch grip.',
    intro:
      'A loop, a handle or a longer reach lets the whole hand or arm do the work a fingertip pinch used to.',
  },
];
