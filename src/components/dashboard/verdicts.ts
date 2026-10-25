import { getFamily } from '../../families';
import { analyse } from '../../app/analysis';
import { savedParams, type Project } from '../../state/projects';
import type { CalibrationProfile } from '../../strength/calibration';
import type { MaterialId } from '../../strength/materials';
import type { PrintSettings } from '../../strength/types';
import type { UseContext } from '../../families/types';

/**
 * A saved design's strength verdict, from the same model and settings the Designer uses. The 3D model
 * isn't built here, so the print orientation is chosen without the bed-size check: the same verdict in
 * almost every case (a design too long for the bed is the exception).
 */
export function projectVerdict(
  p: Project,
  ctx: {
    use: UseContext;
    print: PrintSettings | null;
    safetyFactor: number;
    calibrationFor: (m: MaterialId) => CalibrationProfile | null;
  },
) {
  const family = getFamily(p.familyId);
  if (!family) return null;
  const a = analyse({
    family,
    params: savedParams(p),
    use: ctx.use,
    print: ctx.print,
    safetyFactor: ctx.safetyFactor,
    orientationId: 'auto',
    calibrationFor: ctx.calibrationFor,
    geometry: null,
  });
  return { verdict: a.verdict, calibration: a.calibration };
}
