import type { Analysis } from '../app/analysis';
import type { AnyFamily, Params, UseLocation } from '../families/types';
import type { BuildResult } from '../geometry/protocol';
import type { Paper } from './pdf/base';

export interface OutputContext {
  family: AnyFamily;
  params: Params;
  analysis: Analysis;
  build: BuildResult | null;
  paper: Paper;
  location: UseLocation;
  /** Free text for the request sheet ("where to print"). */
  wherePrint: string;
  date: string;
  /** File names that will be in the package. */
  files: string[];
}
