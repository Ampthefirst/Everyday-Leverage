import tree from './tree.json';
import type { FamilyId, UseLocation } from '../families/types';
import type { LoadLevel } from '../strength/loads';

export type QuestionId = 'task' | 'object' | 'problem' | 'hand' | 'force' | 'location' | 'who';
export type Answers = Partial<Record<QuestionId, string>>;

export interface QuestionOption {
  value: string;
  label: string;
  hint?: string;
  tasks?: string[];
}
export interface Question {
  id: QuestionId;
  text: string;
  textOther: string;
  options: QuestionOption[];
}

export const QUESTIONS = tree.questions as Question[];

/** Options to show for a question given earlier answers (objects are filtered by task). */
export function optionsFor(q: Question, a: Answers): QuestionOption[] {
  if (q.id === 'object' && a.task) return q.options.filter((o) => !o.tasks || o.tasks.includes(a.task!));
  return q.options;
}

export interface Suggestion {
  family: FamilyId;
  preset?: string;
  score: number;
  why: string;
}

export type RouteResult =
  | { kind: 'match'; best: Suggestion; alternates: Suggestion[] }
  | { kind: 'ambiguous'; best: Suggestion; second: Suggestion; alternates: Suggestion[] }
  | { kind: 'out-of-scope'; reason: 'pain' | 'body' }
  | { kind: 'none' };

interface Rule {
  family: FamilyId;
  task?: string[];
  object?: string[];
  problem?: string[];
  weight: number;
  why: string;
}

/**
 * The routing table from the development guide, as weighted rules. A family's score is the sum of
 * the rules it satisfies. Task + object carry most weight; the problem breaks ties (e.g. A1 vs A2).
 */
const RULES: Rule[] = [
  {
    family: 'A1',
    task: ['hold'],
    object: ['utensil', 'pen', 'toothbrush', 'other'],
    weight: 5,
    why: 'Thickens a thin handle so it is easier to grip.',
  },
  {
    family: 'A1',
    problem: ['grip', 'slip'],
    task: ['hold'],
    weight: 3,
    why: 'A thicker, textured grip stops it slipping.',
  },
  {
    family: 'A2',
    task: ['hold'],
    object: ['utensil', 'pen', 'toothbrush'],
    weight: 3,
    why: 'Holds the utensil against the palm — no grip needed.',
  },
  {
    family: 'A2',
    problem: ['noHold'],
    weight: 6,
    why: 'When the hand cannot close around a handle, a cuff holds it for you.',
  },
  { family: 'A3', object: ['tool'], weight: 7, why: 'A big handle on a small tool gives much more twist.' },
  {
    family: 'A3',
    task: ['hold', 'turn'],
    object: ['tool'],
    problem: ['turn', 'grip'],
    weight: 2,
    why: 'More torque from the same hand.',
  },
  {
    family: 'B1',
    task: ['open', 'turn'],
    object: ['jar'],
    weight: 8,
    why: 'A long lever on a cup that grips the lid.',
  },
  { family: 'B1', task: ['open'], object: ['bottle'], weight: 5, why: 'A stepped cup fits a range of caps.' },
  {
    family: 'B3',
    task: ['turn', 'open'],
    object: ['bottle'],
    weight: 5,
    why: 'A socket shaped like the cap with a lever.',
  },
  { family: 'B1', task: ['open'], problem: ['turn', 'slip'], weight: 1, why: 'More leverage for twisting.' },
  {
    family: 'B2',
    task: ['turn', 'open'],
    object: ['key', 'knob'],
    weight: 8,
    why: 'Big wings turn a key or knob with a push instead of a pinch.',
  },
  {
    family: 'B3',
    task: ['turn', 'open'],
    object: ['tap', 'stove'],
    weight: 8,
    why: 'A shaped socket with a lever fits the tap or knob.',
  },
  { family: 'B3', task: ['turn'], object: ['other'], weight: 2, why: 'A socket can be shaped to fit.' },
  {
    family: 'C1',
    task: ['pull', 'open'],
    object: ['drawer', 'zipper', 'can'],
    weight: 8,
    why: 'A loop lets you pull with the whole hand.',
  },
  {
    family: 'C1',
    task: ['pull'],
    object: ['knob', 'other'],
    weight: 3,
    why: 'A loop gives the fingers something to hook.',
  },
  {
    family: 'C2',
    task: ['press'],
    object: ['button', 'screen', 'other'],
    weight: 8,
    why: 'A pusher puts your whole-hand push onto a small button.',
  },
  {
    family: 'C2',
    task: ['reach'],
    object: ['button'],
    weight: 5,
    why: 'A long pusher reaches buttons further away.',
  },
  { family: 'C3', object: ['door'], weight: 7, why: 'A lever extender opens the door with a light push.' },
  {
    family: 'C3',
    task: ['reach'],
    object: ['door', 'other'],
    weight: 4,
    why: 'A longer arm reaches further.',
  },
  { family: 'C3', problem: ['reach'], weight: 1, why: 'More reach.' },
];

const PRESETS: Partial<Record<FamilyId, Record<string, string>>> = {
  A1: { utensil: 'spoon', pen: 'pen', toothbrush: 'toothbrush' },
  A2: { utensil: 'spoon', pen: 'pen', toothbrush: 'toothbrush' },
  B1: { jar: 'jam', bottle: 'bottle' },
  B2: { key: 'house-key', knob: 'knob' },
  B3: { bottle: 'bottle', tap: 'tap', stove: 'stove' },
  C1: { drawer: 'drawer', zipper: 'zipper', can: 'can' },
  C2: { button: 'lift', screen: 'stylus' },
  C3: { door: 'door' },
};

const matches = (list: string[] | undefined, v: string | undefined) =>
  !list || (v !== undefined && list.includes(v));

/** Two families within this score of each other are shown side by side. */
export const AMBIGUOUS_MARGIN = 1;
const MIN_SCORE = 5;

export function route(a: Answers): RouteResult {
  if (a.task === 'body') return { kind: 'out-of-scope', reason: 'body' };
  if (a.problem === 'pain') return { kind: 'out-of-scope', reason: 'pain' };
  const scores = new Map<FamilyId, { score: number; why: string }>();
  for (const r of RULES) {
    if (!matches(r.task, a.task) || !matches(r.object, a.object) || !matches(r.problem, a.problem)) continue;
    const cur = scores.get(r.family);
    scores.set(r.family, {
      score: (cur?.score ?? 0) + r.weight,
      why: cur && cur.score >= r.weight ? cur.why : r.why,
    });
  }
  const ranked: Suggestion[] = [...scores.entries()]
    .map(([family, s]) => ({
      family,
      score: s.score,
      why: s.why,
      preset: a.object ? PRESETS[family]?.[a.object] : undefined,
    }))
    .sort((x, y) => y.score - x.score || x.family.localeCompare(y.family));
  if (!ranked.length || ranked[0].score < MIN_SCORE) return { kind: 'none' };
  const [best, second, ...rest] = ranked;
  if (second && best.score - second.score <= AMBIGUOUS_MARGIN)
    return { kind: 'ambiguous', best, second, alternates: rest.slice(0, 2) };
  return { kind: 'match', best, alternates: [second, ...rest].filter(Boolean).slice(0, 2) };
}

/** Use context to carry into the Designer (answers themselves are never stored). */
export function contextFromAnswers(a: Answers): {
  level: LoadLevel;
  location: UseLocation;
  hand?: 'left' | 'right';
} {
  return {
    level: (a.force as LoadLevel) ?? 'moderate',
    location: (a.location as UseLocation) ?? 'kitchen',
    hand: a.hand === 'left' ? 'left' : a.hand === 'right' ? 'right' : undefined,
  };
}
