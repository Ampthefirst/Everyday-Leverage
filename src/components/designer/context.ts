import { createContext, useContext } from 'react';
import type { Analysis } from '../../app/analysis';
import type { AnyFamily, Params } from '../../families/types';
import type { BuildResult } from '../../geometry/protocol';

export interface DesignerCtxValue {
  family: AnyFamily;
  params: Params;
  analysis: Analysis;
  build: BuildResult | null;
  building: boolean;
  buildError: string | null;
  setParam: (key: string, v: number | string | boolean) => void;
  openMeasure: (stepId: string) => void;
}

export const DesignerCtx = createContext<DesignerCtxValue | null>(null);

export function useDesigner(): DesignerCtxValue {
  const v = useContext(DesignerCtx);
  if (!v) throw new Error('DesignerCtx missing');
  return v;
}
