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
