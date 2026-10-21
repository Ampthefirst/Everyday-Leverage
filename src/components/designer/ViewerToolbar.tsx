import { useDesign } from '../../state/design';
import { Button } from '../Button';
import { StrengthBadge } from '../StrengthBadge';
import { useDesigner } from './context';

function ToggleButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`tap rounded-xl border-2 px-3 text-sm font-semibold ${pressed ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-text hover:border-primary'}`}
    >
      {children}
    </button>
  );
}

export function ViewerToolbar({
  onReset,
  onPlay,
  playing,
  reduced,
}: {
  onReset: () => void;
  onPlay: () => void;
  playing: boolean;
  reduced: boolean;
}) {
  const view = useDesign((s) => s.view);
  const setView = useDesign((s) => s.setView);
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-border bg-surface p-2"
      role="toolbar"
      aria-label="3D view controls"
    >
      <Button variant="ghost" onClick={onReset}>
        Reset view
      </Button>
      <ToggleButton pressed={view.ghost} onClick={() => setView({ ghost: !view.ghost })}>
        Show object
      </ToggleButton>
      <ToggleButton pressed={view.section} onClick={() => setView({ section: !view.section })}>
        Cut open
      </ToggleButton>
      <ToggleButton pressed={view.heat} onClick={() => setView({ heat: !view.heat })}>
        Stress map
      </ToggleButton>
      <ToggleButton pressed={view.mirror} onClick={() => setView({ mirror: !view.mirror })}>
        Mirror L/R
      </ToggleButton>
      <ToggleButton pressed={playing} onClick={onPlay}>
        {reduced ? 'How to use (steps)' : playing ? 'Stop' : 'How to use'}
      </ToggleButton>
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
