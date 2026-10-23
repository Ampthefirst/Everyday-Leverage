import { useDesign } from '../../state/design';
import { Button } from '../Button';
import { StrengthBadge } from '../StrengthBadge';
import { useDesigner } from './context';
import type { CameraCommand } from '../../viewer/Viewer';

function ToggleButton({
  pressed,
  onClick,
  children,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`tap shrink-0 rounded-md border px-3 text-base font-medium whitespace-nowrap ${pressed ? 'border-primary bg-info-bg text-primary shadow-[inset_0_0_0_1px_var(--color-primary)]' : 'border-border bg-surface text-text hover:border-text'}`}
    >
      {children}
    </button>
  );
}

// Plain stroke glyphs on a 20-unit grid, drawn in the text colour.
const GLYPH: Record<CameraCommand, string> = {
  left: 'M12.5 4.5 7 10l5.5 5.5',
  right: 'M7.5 4.5 13 10l-5.5 5.5',
  up: 'M4.5 12.5 10 7l5.5 5.5',
  down: 'M4.5 7.5 10 13l5.5-5.5',
  in: 'M10 4v12M4 10h12',
  out: 'M4 10h12',
};

function CamIcon({ c }: { c: CameraCommand }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={GLYPH[c]} />
    </svg>
  );
}

const CAM: { c: CameraCommand; label: string }[] = [
  { c: 'left', label: 'Turn view left' },
  { c: 'right', label: 'Turn view right' },
  { c: 'up', label: 'Tilt view up' },
  { c: 'down', label: 'Tilt view down' },
  { c: 'in', label: 'Zoom in' },
  { c: 'out', label: 'Zoom out' },
];

export function ViewerToolbar({
  onReset,
  onPlay,
  playing,
  reduced,
  onCamera,
}: {
  onReset: () => void;
  onPlay: () => void;
  playing: boolean;
  reduced: boolean;
  onCamera: (c: CameraCommand) => void;
}) {
  const view = useDesign((s) => s.view);
  const setView = useDesign((s) => s.setView);
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto border-b border-rule bg-surface px-4 py-2 sm:flex-wrap sm:px-6"
      role="toolbar"
      aria-label="3D view controls"
    >
      <ToggleButton
        pressed={view.ghost}
        onClick={() => setView({ ghost: !view.ghost })}
        label="Show the object around the part"
      >
        Object
      </ToggleButton>
      <ToggleButton
        pressed={view.section}
        onClick={() => setView({ section: !view.section })}
        label="Cut the part open"
      >
        Cut open
      </ToggleButton>
      <ToggleButton
        pressed={view.heat}
        onClick={() => setView({ heat: !view.heat })}
        label="Show the stress map"
      >
        Stress map
      </ToggleButton>
      <ToggleButton
        pressed={view.mirror}
        onClick={() => setView({ mirror: !view.mirror })}
        label="Mirror left and right"
      >
        Mirror
      </ToggleButton>
      <ToggleButton
        pressed={playing}
        onClick={onPlay}
        label={reduced ? 'Show the next how-to-use step' : 'Play the how-to-use animation'}
      >
        {reduced ? 'How to use: next step' : playing ? 'Stop' : 'How to use'}
      </ToggleButton>
      <span className="ml-auto flex shrink-0 items-center gap-1" role="group" aria-label="Move the view">
        {CAM.map((b) => (
          <button
            key={b.c}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={() => onCamera(b.c)}
            className="tap hidden items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text sm:inline-flex"
          >
            <CamIcon c={b.c} />
          </button>
        ))}
        <Button variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </span>
    </div>
  );
}

export function SectionSlider() {
  const view = useDesign((s) => s.view);
  const setView = useDesign((s) => s.setView);
  if (!view.section) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 border-b border-rule bg-surface px-4 sm:px-6">
      <label htmlFor="section-pos" className="text-base font-semibold">
        Cut position
      </label>
      <input
        id="section-pos"
        type="range"
        min={0.02}
        max={0.98}
        step={0.01}
        value={view.sectionPos}
        onChange={(e) => setView({ sectionPos: Number(e.target.value) })}
        className="flex-1"
      />
      <span className="text-sm text-muted">Blue: solid walls. Striped: infill.</span>
    </div>
  );
}

export function HeatLegend() {
  const { analysis } = useDesigner();
  const view = useDesign((s) => s.view);
  if (!view.heat) return null;
  return (
    <div className="pointer-events-none absolute right-4 bottom-4 rounded-md border border-border bg-surface/95 p-3 text-sm lg:right-6 lg:bottom-6">
      <div className="mb-1.5 font-serif text-base">Stress map</div>
      <div
        className="h-2.5 w-48 rounded-full"
        style={{ background: 'linear-gradient(90deg, #2659d9 0%, #1ab373 30%, #f2bf1a 60%, #d91a1a 100%)' }}
        aria-hidden="true"
      />
      <div className="flex w-48 justify-between text-xs text-muted">
        <span>low</span>
        <span>60%</span>
        <span>at limit</span>
      </div>
      <div className="mt-2">
        <StrengthBadge calibration={analysis.calibration} fea />
      </div>
    </div>
  );
}
