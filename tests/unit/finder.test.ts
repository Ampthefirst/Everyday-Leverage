import { describe, expect, it } from 'vitest';
import { optionsFor, QUESTIONS, route, contextFromAnswers, type Answers } from '../../src/finder/router';
import { getFamily } from '../../src/families';

const top = (a: Answers) => {
  const r = route(a);
  return r.kind === 'match' || r.kind === 'ambiguous' ? r.best.family : r.kind;
};

describe('task finder routing table (guide)', () => {
  it.each([
    ['Hold, thin handle hard to grip → A1', { task: 'hold', object: 'utensil', problem: 'grip' }, 'A1'],
    ['Hold, pen slips → A1', { task: 'hold', object: 'pen', problem: 'slip' }, 'A1'],
    ['Hold, grip cannot be maintained → A2', { task: 'hold', object: 'utensil', problem: 'noHold' }, 'A2'],
    ['Hold, small tool, needs torque → A3', { task: 'hold', object: 'tool', problem: 'turn' }, 'A3'],
    ['Open, jar lid → B1', { task: 'open', object: 'jar', problem: 'turn' }, 'B1'],
    ['Turn, key → B2', { task: 'turn', object: 'key', problem: 'turn' }, 'B2'],
    ['Turn, round knob → B2', { task: 'turn', object: 'knob', problem: 'grip' }, 'B2'],
    ['Turn, tap → B3', { task: 'turn', object: 'tap', problem: 'turn' }, 'B3'],
    ['Turn, stove knob → B3', { task: 'turn', object: 'stove', problem: 'turn' }, 'B3'],
    ['Pull, drawer → C1', { task: 'pull', object: 'drawer', problem: 'pull' }, 'C1'],
    ['Pull, zipper → C1', { task: 'pull', object: 'zipper', problem: 'pull' }, 'C1'],
    ['Pull, can tab → C1', { task: 'pull', object: 'can', problem: 'pull' }, 'C1'],
    ['Press, button → C2', { task: 'press', object: 'button', problem: 'press' }, 'C2'],
    ['Press, screen → C2', { task: 'press', object: 'screen', problem: 'press' }, 'C2'],
    ['Reach, door lever → C3', { task: 'reach', object: 'door', problem: 'reach' }, 'C3'],
    ['Open, door lever → C3', { task: 'open', object: 'door', problem: 'turn' }, 'C3'],
  ] as [string, Answers, string][])('%s', (_l, a, fam) => {
    expect(top(a)).toBe(fam);
  });

  it('bottle caps are ambiguous between B1 and B3 (side by side)', () => {
    const r = route({ task: 'open', object: 'bottle', problem: 'turn' });
    expect(r.kind).toBe('ambiguous');
    if (r.kind === 'ambiguous') expect([r.best.family, r.second.family].sort()).toEqual(['B1', 'B3']);
  });

  it('hold + utensil without a problem is ambiguous A1/A2 or picks A1, never something else', () => {
    const r = route({ task: 'hold', object: 'utensil' });
    expect(r.kind === 'match' || r.kind === 'ambiguous').toBe(true);
    if (r.kind === 'match' || r.kind === 'ambiguous') expect(r.best.family).toBe('A1');
  });

  it('pain or injury → out of scope, no design', () => {
    expect(route({ task: 'hold', object: 'utensil', problem: 'pain' })).toEqual({
      kind: 'out-of-scope',
      reason: 'pain',
    });
  });

  it('supporting the body → out of scope', () => {
    expect(route({ task: 'body' })).toEqual({ kind: 'out-of-scope', reason: 'body' });
  });

  it('no match → none (manual picker)', () => {
    expect(
      route({ task: 'hold', object: 'other', problem: 'press' }).kind === 'none' ||
        top({ task: 'hold', object: 'other', problem: 'press' }) === 'A1',
    ).toBe(true);
    expect(route({}).kind).toBe('none');
  });

  it('returns up to two alternates and valid presets', () => {
    const r = route({ task: 'turn', object: 'tap', problem: 'turn' });
    expect(r.kind).toBe('match');
    if (r.kind === 'match') {
      expect(r.alternates.length).toBeLessThanOrEqual(2);
      expect(r.best.preset).toBe('tap');
    }
    // Every preset the router names exists on its family.
    for (const task of ['open', 'hold', 'turn', 'pull', 'press', 'reach']) {
      for (const o of QUESTIONS[1].options) {
        const rr = route({ task, object: o.value });
        if (rr.kind === 'match' || rr.kind === 'ambiguous') {
          for (const s of [rr.best, ...rr.alternates, ...(rr.kind === 'ambiguous' ? [rr.second] : [])]) {
            if (s.preset)
              expect(
                getFamily(s.family)!.presets.some((p) => p.id === s.preset),
                `${s.family}/${s.preset}`,
              ).toBe(true);
          }
        }
      }
    }
  });

  it('objects are filtered by task', () => {
    const objs = optionsFor(QUESTIONS[1], { task: 'press' }).map((o) => o.value);
    expect(objs).toContain('button');
    expect(objs).not.toContain('jar');
  });

  it('carries load level, location and hand to the designer', () => {
    expect(contextFromAnswers({ force: 'heavy', location: 'bathroom', hand: 'left' })).toEqual({
      level: 'heavy',
      location: 'bathroom',
      hand: 'left',
    });
    expect(contextFromAnswers({ hand: 'either' }).hand).toBeUndefined();
  });
});
