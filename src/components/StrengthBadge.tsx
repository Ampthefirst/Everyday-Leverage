import { Badge } from './Badge';
import type { CalibrationProfile } from '../strength/calibration';

/** The mandatory strength badge (PLAN §0): never hidden in v1. */
export function StrengthBadge({
  calibration,
  fea = false,
}: {
  calibration: CalibrationProfile | null;
  fea?: boolean;
}) {
  if (calibration) {
    return (
      <Badge tone="ok" title="Strength constants come from your test bars. They apply only to that printer.">
        Calibrated to {calibration.printerName}
      </Badge>
    );
  }
  return (
    <Badge
      tone="warn"
      title="Computed from published material data with standard FDM reductions — not tested on your printer."
    >
      {fea ? 'Uncalibrated estimate — not FEA' : 'Uncalibrated estimate'}
    </Badge>
  );
}
