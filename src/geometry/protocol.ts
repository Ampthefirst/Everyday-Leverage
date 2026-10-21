import type { FamilyId, Params } from '../families/types';
import type { MeshData } from './kernel';

export interface SplitRequest {
  /** Split the part into two pieces along this part-frame axis at `at` (mm). */
  axis: 'x' | 'y' | 'z';
  at: number;
}

export type WorkerRequest =
  | { id: number; type: 'build'; familyId: FamilyId; params: Params; split?: SplitRequest | null }
  | { id: number; type: 'fitTest'; familyId: FamilyId; params: Params }
  | {
      id: number;
      type: 'section';
      familyId: FamilyId;
      params: Params;
      axis: 'x' | 'y' | 'z';
      offset: number;
      shellT: number;
    }
  | { id: number; type: 'bar' };

export interface BuildResult {
  mesh: MeshData;
  pieces: MeshData[];
  volume: number;
  surfaceArea: number;
  ms: number;
}

export interface SectionResult {
  /** Outer region polygons and the infill region (outer offset inward by the shell), in plane coords. */
  outer: [number, number][][];
  inner: [number, number][][];
  area: number;
}

export type WorkerResponse =
  | { id: number; ok: true; type: 'build'; result: BuildResult }
  | { id: number; ok: true; type: 'fitTest' | 'bar'; result: MeshData }
  | { id: number; ok: true; type: 'section'; result: SectionResult }
  | { id: number; ok: false; error: string }
  | { id: number; ok: false; stale: true };
