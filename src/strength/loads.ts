import { nmToNmm } from '../types/units';
import type { LoadCase } from './types';

export type LoadLevel = 'light' | 'moderate' | 'heavy';
export const LOAD_SCALE: Record<LoadLevel, number> = { light: 0.6, moderate: 1, heavy: 1.6 };

export type TaskLoad =
  | 'jarLid'
  | 'jarLidHeavy'
  | 'key'
  | 'knob'
  | 'toolSocket'
  | 'drawerPull'
  | 'zipperTab'
  | 'buttonPress'
  | 'utensilGrip'
  | 'utensilTwist'
  | 'reachTip';

/** Default task loads (assumed; editable). Torque in N·m here, converted to N·mm in the load case. */
export const TASK_LOADS: Record<
  TaskLoad,
  { label: string; kind: 'torque' | 'force'; value: number; unit: 'N·m' | 'N' }
> = {
  jarLid: { label: 'Twisting a jar lid', kind: 'torque', value: 4, unit: 'N·m' },
  jarLidHeavy: { label: 'Twisting a stuck jar lid', kind: 'torque', value: 8, unit: 'N·m' },
  key: { label: 'Turning a key', kind: 'torque', value: 0.6, unit: 'N·m' },
  knob: { label: 'Turning a knob, tap or cap', kind: 'torque', value: 1.5, unit: 'N·m' },
  toolSocket: { label: 'Turning a small tool', kind: 'torque', value: 2, unit: 'N·m' },
  drawerPull: { label: 'Pulling a drawer or door', kind: 'force', value: 40, unit: 'N' },
  zipperTab: { label: 'Pulling a zipper or tab', kind: 'force', value: 20, unit: 'N' },
  buttonPress: { label: 'Pressing a button', kind: 'force', value: 15, unit: 'N' },
  utensilGrip: { label: 'Gripping a utensil', kind: 'force', value: 30, unit: 'N' },
  utensilTwist: { label: 'Twisting a utensil', kind: 'torque', value: 0.3, unit: 'N·m' },
  reachTip: { label: 'Pushing at the tip', kind: 'force', value: 30, unit: 'N' },
};

export interface LoadInput {
  task: TaskLoad;
  level: LoadLevel;
  /** User override in display units (N·m or N); replaces the default before scaling. */
  override?: number;
  /** Overrides keyed by task; the one for this task is used. */
  overrides?: Partial<Record<string, number>>;
  repeated?: boolean;
}

export function makeLoadCase({ task, level, override: single, overrides, repeated }: LoadInput): LoadCase {
  const t = TASK_LOADS[task];
  const override = single ?? overrides?.[task];
  const display = override ?? t.value;
  const base = t.kind === 'torque' ? nmToNmm(display) : display;
  return {
    id: task,
    label: t.label,
    kind: t.kind,
    base,
    value: base * LOAD_SCALE[level],
    assumed: override === undefined,
    repeated,
  };
}

/** Value for display: N·m for torque, N for force. */
export function displayLoad(lc: LoadCase): { value: number; unit: string } {
  return lc.kind === 'torque' ? { value: lc.value / 1000, unit: 'N·m' } : { value: lc.value, unit: 'N' };
}
