import { lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// PDF/zip generation (jsPDF, fflate) loads only when the Get files tab opens.
const FilesPanel = lazy(() => import('../components/designer/FilesPanel'));
import { Link, useParams } from 'react-router-dom';
import { getFamily } from '../families';
import type { FamilyId } from '../families/types';
import { useDesign } from '../state/design';
import { useCalibration } from '../state/calibration';
import { prefersReducedMotion } from '../state/settings';
import { useProfiles } from '../state/profiles';
import { analyse } from '../app/analysis';
import { geometry, StaleError } from '../geometry/client';
import type { BuildResult, SectionResult } from '../geometry/protocol';
import { Viewer, type CameraCommand } from '../viewer/Viewer';
import { Tabs } from '../components/Tabs';
import { DesignerCtx } from '../components/designer/context';
import { FitPanel, StylePanel } from '../components/designer/FitPanel';
import { StrengthPanel } from '../components/designer/StrengthPanel';
import { PrintPanel } from '../components/designer/PrintPanel';
import { HeatLegend, SectionSlider, ViewerToolbar } from '../components/designer/ViewerToolbar';
import { Dialog } from '../components/Dialog';
import { Illustration } from '../components/Illustration';
import { Page, PageHeader } from '../components/Card';
import { Button, LinkButton } from '../components/Button';
import { Meter } from '../components/Meter';
import { StrengthBadge } from '../components/StrengthBadge';
import { shellThickness } from '../strength/types';
import { splitPlanFor } from '../geometry/splitPlan';
import { useShareLink } from '../profiles/share';

type TabId = 'fit' | 'style' | 'strength' | 'print' | 'files';
const TABS: { id: TabId; label: string }[] = [
  { id: 'fit', label: 'Fit' },
  { id: 'style', label: 'Style' },
  { id: 'strength', label: 'Strength' },
  { id: 'print', label: 'Print' },
  { id: 'files', label: 'Get files' },
];

export default function DesignerPage() {
  const { familyId = '' } = useParams();
  const family = getFamily(familyId);
  if (!family) {
    return (
      <Page narrow>
        <PageHeader title="Design not found" lead={`There is no design called “${familyId}”.`} />
        <LinkButton to="/design">See all designs</LinkButton>
      </Page>
    );
  }
  return <Designer key={family.id} familyId={family.id} />;
}

function Designer({ familyId }: { familyId: FamilyId }) {
  const family = getFamily(familyId)!;
  useShareLink(familyId);
  const stored = useDesign((s) => s.params[familyId]);
  const getParams = useDesign((s) => s.getParams);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const params = useMemo(() => getParams(familyId), [stored, familyId, getParams]);
  const setParamStore = useDesign((s) => s.setParam);
  const use = useDesign((s) => s.use);
  const print = useDesign((s) => s.print);
  const safetyFactor = useDesign((s) => s.safetyFactor);
  const orientationId = useDesign((s) => s.orientation);
  const view = useDesign((s) => s.view);
  useCalibration((s) => s.active);
  const calibrationFor = useCalibration((s) => s.activeFor);
  const handBreadth = useProfiles((s) => s.current().handBreadth);

  const [tab, setTab] = useState<TabId>('fit');
  const [build, setBuild] = useState<BuildResult | null>(null);
  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionResult | null>(null);
  const [measure, setMeasure] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [animStep, setAnimStep] = useState(-1);
  const [camCmd, setCamCmd] = useState<{ c: CameraCommand; n: number } | null>(null);
  const reduced = prefersReducedMotion();

  const paramsKey = JSON.stringify(params);
  const hasSchemaErrors = !family.schema.safeParse(params).success;

  // Geometry size first without split; split decided from the bed fit of the whole part.
  const geomInfo = useMemo(() => {
    if (!build) return null;
    const b = build.mesh.bbox;
    return {
      size: [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]] as [number, number, number],
      volume: build.volume,
      surfaceArea: build.surfaceArea,
      split: build.pieces.length > 0,
    };
  }, [build]);

  const analysis = useMemo(
    () =>
      analyse({
        family,
        params,
        use,
        print,
        safetyFactor,
        orientationId,
        calibrationFor,
        geometry: geomInfo,
      }),
    [family, params, use, print, safetyFactor, orientationId, calibrationFor, geomInfo],
  );

  // Rebuild (debounced 120 ms); stale jobs are dropped by the worker.
  useEffect(() => {
    if (hasSchemaErrors) return;
    let cancelled = false;
    setBuilding(true);
    const t = setTimeout(async () => {
      try {
        const split = splitPlanFor(family, params);
        const r = await geometry.build({ type: 'build', familyId, params, split });
        if (!cancelled) {
          setBuild(r);
          setBuildError(null);
        }
      } catch (e) {
        if (e instanceof StaleError) return;
        if (!cancelled) setBuildError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setBuilding(false);
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, paramsKey, hasSchemaErrors]);

  // Cross-section overlay.
  const axis = family.sectionAxis;
  const sectionOffset = useMemo(() => {
    if (!build) return 0;
    const i = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    const lo = build.mesh.bbox.min[i];
    const hi = build.mesh.bbox.max[i];
    return lo + (hi - lo) * view.sectionPos;
  }, [build, axis, view.sectionPos]);
  const shellT = shellThickness(analysis.print);
  useEffect(() => {
    if (!view.section || !build) return;
    const t = setTimeout(async () => {
      try {
        setSection(
          await geometry.section({ type: 'section', familyId, params, axis, offset: sectionOffset, shellT }),
        );
      } catch (e) {
        if (!(e instanceof StaleError)) setSection(null);
      }
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.section, build, sectionOffset, shellT]);

  // "How to use" animation.
  const animation = useMemo(() => family.animation(params), [family, params]);
  const playTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPlay = useCallback(() => {
    if (playTimer.current) clearInterval(playTimer.current);
    playTimer.current = null;
    setAnimStep(-1);
  }, []);
  const onPlay = () => {
    if (reduced) {
      setAnimStep((s) => (s + 1 >= animation.steps.length ? -1 : s + 1));
      return;
    }
    if (playTimer.current) return stopPlay();
    setAnimStep(0);
    playTimer.current = setInterval(() => {
      setAnimStep((s) => {
        if (s + 1 >= animation.steps.length) {
          if (playTimer.current) clearInterval(playTimer.current);
          playTimer.current = null;
          return -1;
        }
        return s + 1;
      });
    }, 1800);
  };
  useEffect(() => () => stopPlay(), [stopPlay]);

  const ghost = useMemo(() => family.ghost(params), [family, params]);
  const setParam = useCallback(
    (k: string, v: number | string | boolean) => setParamStore(familyId, k, v),
    [familyId, setParamStore],
  );
  const ctx = { family, params, analysis, build, building, buildError, setParam, openMeasure: setMeasure };
  const v = analysis.verdict;
  const caption = animStep >= 0 ? animation.steps[animStep]?.caption : null;

  return (
    <DesignerCtx.Provider value={ctx}>
      <div className="flex flex-col lg:h-[calc(100vh-4.1rem)] lg:flex-row">
        <section
          aria-label="3D preview"
          className="sticky top-0 z-20 flex min-h-0 flex-col bg-surface shadow-sm lg:static lg:flex-1 lg:shadow-none [@media(max-height:699px)]:static"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-surface px-3 py-2">
            <h1 className="text-xl font-bold">
              <span className="text-muted">{family.id}</span> {family.name}
            </h1>
            <Link to="/design" className="text-sm text-primary underline">
              Change design
            </Link>
            <span className="ml-auto text-sm text-muted" role="status" aria-live="polite">
              {building
                ? 'Updating…'
                : buildError
                  ? 'Could not build this shape'
                  : build
                    ? `Built in ${Math.round(build.ms)} ms`
                    : ''}
            </span>
          </div>
          <ViewerToolbar
            onReset={() => setResetKey((k) => k + 1)}
            onCamera={(c) => setCamCmd({ c, n: Date.now() })}
            onPlay={onPlay}
            playing={animStep >= 0}
            reduced={reduced}
          />
          <SectionSlider />
          <div className="relative h-[38vh] min-h-56 lg:h-auto lg:flex-1">
            <Viewer
              mesh={build?.mesh ?? null}
              pieces={build?.pieces ?? []}
              field={analysis.field}
              heat={view.heat}
              ghost={ghost}
              showGhost={view.ghost}
              section={view.section ? { axis, offset: sectionOffset, data: section } : null}
              displayRotation={family.displayRotation}
              mirror={view.mirror}
              animation={animStep >= 0 ? { spec: animation, step: animStep, reduced } : null}
              handBreadth={handBreadth}
              resetKey={resetKey}
              camera={camCmd}
              label={`3D view of the ${family.name}. ${v.reason}`}
            />
            <div
              className={`pointer-events-none absolute inset-0 flex items-start justify-center p-3 transition-opacity ${building ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden="true"
            >
              <span className="rounded-full bg-surface/90 px-3 py-1 text-sm shadow">Updating…</span>
            </div>
            {caption && (
              <div
                className="absolute inset-x-3 top-3 rounded-xl border border-border bg-surface/95 p-3 text-lg font-semibold shadow"
                aria-live="polite"
              >
                Step {animStep + 1} of {animation.steps.length}: {caption}
              </div>
            )}
            {buildError && (
              <div
                className="absolute inset-x-3 bottom-3 rounded-xl border border-bad bg-bad-bg p-3"
                role="alert"
              >
                {buildError}
              </div>
            )}
            <HeatLegend />
            <div className="meter-overlay absolute right-3 top-3 hidden w-64 rounded-xl border border-border bg-surface/95 p-3 shadow sm:block">
              <Meter u={v.utilization} level={v.level} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <StrengthBadge calibration={analysis.calibration} />
                <button
                  type="button"
                  onClick={() => setTab('strength')}
                  className="tap text-sm font-semibold text-primary underline"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </section>
        <aside
          aria-label="Design settings"
          className="flex min-h-0 flex-col border-l border-border bg-surface lg:w-[30rem]"
        >
          <ErrorBanner onShow={() => setTab('print')} />
          <Tabs tabs={TABS} active={tab} onChange={setTab} label="Design steps">
            {tab === 'fit' && <FitPanel />}
            {tab === 'style' && <StylePanel />}
            {tab === 'strength' && <StrengthPanel />}
            {tab === 'print' && <PrintPanel />}
            {tab === 'files' && (
              <Suspense fallback={<p role="status">Loading file tools…</p>}>
                <FilesPanel />
              </Suspense>
            )}
          </Tabs>
        </aside>
      </div>
      <Dialog open={!!measure} onClose={() => setMeasure(null)} title="How to measure">
        <ol className="space-y-6">
          {family.measureGuide.map((s, i) => (
            <li
              key={s.id}
              className={`rounded-xl border-2 p-4 ${s.id === measure ? 'border-primary' : 'border-border'}`}
            >
              <h3 className="text-lg font-bold">
                {i + 1}. {s.title}
              </h3>
              <Illustration id={s.illustration} />
              <p>{s.text}</p>
              {s.tip && <p className="mt-2 text-sm text-muted">Tip: {s.tip}</p>}
            </li>
          ))}
        </ol>
      </Dialog>
    </DesignerCtx.Provider>
  );
}

/** Shown above the tabs whenever the design has a blocking problem. */
function ErrorBanner({ onShow }: { onShow: () => void }) {
  const { analysis, family, params } = useContext(DesignerCtx)!;
  const setParams = useDesign((s) => s.setParams);
  const errors = analysis.issues.filter((i) => i.severity === 'error');
  if (!errors.length) return null;
  return (
    <div role="alert" className="m-3 rounded-xl border-l-4 border-bad bg-bad-bg p-3">
      <p className="font-semibold">{errors[0].message}</p>
      {errors[0].fix && <p>{errors[0].fix}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setParams(family.id, family.repair(params))}>
          Fix it for me
        </Button>
        {errors.length > 1 && (
          <Button variant="ghost" onClick={onShow}>
            See all {errors.length} problems
          </Button>
        )}
      </div>
    </div>
  );
}
