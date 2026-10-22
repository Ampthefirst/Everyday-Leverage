import { Badge } from './Badge';
import { showDisclaimers } from '../content/disclaimers';
import type { CalibrationProfile } from '../strength/calibration';

/** The mandatory strength badge (CLAUDE.md badge rule). Only the presentation build hides it. */
export function StrengthBadge({
  calibration,
  fea = false,
}: {
  calibration: CalibrationProfile | null;
  fea?: boolean;
}) {
  if (!showDisclaimers()) return null;
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
