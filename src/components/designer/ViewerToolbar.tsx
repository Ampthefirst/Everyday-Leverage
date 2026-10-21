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
      className={`tap rounded-xl border-2 px-3 text-sm font-semibold ${pressed ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-text hover:border-primary'}`}
    >
      {children}
    </button>
  );
}

const CAM: { c: CameraCommand; label: string; icon: string }[] = [
  { c: 'left', label: 'Turn view left', icon: '⟲' },
  { c: 'right', label: 'Turn view right', icon: '⟳' },
  { c: 'up', label: 'Tilt view up', icon: '▲' },
  { c: 'down', label: 'Tilt view down', icon: '▼' },
  { c: 'in', label: 'Zoom in', icon: '+' },
  { c: 'out', label: 'Zoom out', icon: '−' },
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
      className="flex flex-wrap items-center gap-1.5 border-b border-border bg-surface p-2"
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
        {reduced ? 'How to use ›' : playing ? 'Stop' : 'How to use'}
      </ToggleButton>
      <span className="ml-auto flex flex-wrap items-center gap-1" role="group" aria-label="Move the view">
        {CAM.map((b) => (
          <button
            key={b.c}
            type="button"
            aria-label={b.label}
            title={b.label}
            onClick={() => onCamera(b.c)}
            className="tap rounded-lg border border-border bg-surface px-2 text-lg font-bold hover:border-primary"
          >
            <span aria-hidden="true">{b.icon}</span>
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
    <div className="flex items-center gap-3 border-b border-border bg-surface px-3">
      <label htmlFor="section-pos" className="text-sm font-semibold">
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
      <span className="text-sm text-muted">Blue = solid walls, striped = infill</span>
    </div>
  );
}

export function HeatLegend() {
  const { analysis } = useDesigner();
  const view = useDesign((s) => s.view);
  if (!view.heat) return null;
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 rounded-xl border border-border bg-surface/95 p-3 text-sm shadow">
      <div className="mb-1 font-semibold">Stress map</div>
      <div
        className="h-3 w-48 rounded"
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
