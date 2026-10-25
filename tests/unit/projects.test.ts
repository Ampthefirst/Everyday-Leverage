import { beforeEach, describe, expect, it } from 'vitest';
import { getFamily } from '../../src/families';
import { autoName, sortedProjects, useProjects } from '../../src/state/projects';

const b1 = getFamily('B1')!;

describe('saved projects (shelf)', () => {
  beforeEach(() => useProjects.setState({ projects: [], activeId: null }));

  it('saves with an automatic name and makes the new project active', () => {
    const id = useProjects
      .getState()
      .save({ familyId: 'B1', params: b1.defaults, presetId: b1.presets[1].id, step: 'measure' });
    const p = useProjects.getState().projects[0];
    expect(p.id).toBe(id);
    expect(useProjects.getState().activeId).toBe(id);
    expect(p.name).toBe(`${b1.name} · ${b1.presets[1].label}`);
    // Only the design, its sizes and the step: nothing else is stored.
    expect(Object.keys(p).sort()).toEqual([
      'familyId',
      'id',
      'name',
      'params',
      'presetId',
      'step',
      'updatedAt',
    ]);
  });

  it('numbers repeated names', () => {
    expect(autoName('B1', undefined, [b1.name])).toBe(`${b1.name} (2)`);
    expect(autoName('B1', undefined, [b1.name, `${b1.name} (2)`])).toBe(`${b1.name} (3)`);
  });

  it('renames, duplicates, updates the step and deletes', () => {
    const s = useProjects.getState();
    const id = s.save({ familyId: 'B1', params: b1.defaults, step: 'brief' });
    s.rename(id, '  Kitchen jar  ');
    expect(useProjects.getState().projects[0].name).toBe('Kitchen jar');
    s.rename(id, '   ');
    expect(useProjects.getState().projects[0].name).toBe('Kitchen jar');
    const copy = s.duplicate(id)!;
    expect(useProjects.getState().projects.find((p) => p.id === copy)!.name).toBe('Kitchen jar (copy)');
    s.update(id, { step: 'check' });
    expect(useProjects.getState().projects.find((p) => p.id === id)!.step).toBe('check');
    s.remove(id);
    expect(useProjects.getState().projects.map((p) => p.id)).toEqual([copy]);
    expect(useProjects.getState().activeId).toBeNull();
  });

  it('lists the most recently updated first', () => {
    const a = {
      id: 'a',
      name: 'a',
      familyId: 'B1' as const,
      params: {},
      step: 'brief' as const,
      updatedAt: '2026-01-01T00:00:00Z',
    };
    const b = { ...a, id: 'b', updatedAt: '2026-02-01T00:00:00Z' };
    expect(sortedProjects([a, b]).map((p) => p.id)).toEqual(['b', 'a']);
  });
});

describe('account sync merge', () => {
  const base = { familyId: 'B1' as const, params: {}, step: 'measure' as const };
  const p = (id: string, updatedAt: string, name = id) => ({ ...base, id, name, updatedAt });
  it('keeps every design and the newer copy of each', async () => {
    const { mergeProjects, toUpload } = await import('../../src/accounts/sync');
    const local = [p('a', '2026-10-02', 'a-local'), p('b', '2026-10-01')];
    const remote = [p('a', '2026-10-01', 'a-remote'), p('c', '2026-10-03')];
    const m = mergeProjects(local, remote);
    expect(m.map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(m.find((x) => x.id === 'a')!.name).toBe('a-local');
    expect(toUpload(local, remote).map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('saved sizes', () => {
  it('fills sizes a saved copy lacks from the design defaults', async () => {
    const { savedParams } = await import('../../src/state/projects');
    const p = savedParams({ familyId: 'B1', params: { lidMin: 26, lidMax: 40, lever: 110 } });
    expect(p.lidMax).toBe(40);
    expect(typeof p.wall).toBe('number');
    expect(Object.values(p).every((v) => v !== undefined && !Number.isNaN(v))).toBe(true);
  });
});
