import { useEffect, useMemo, useState } from 'react';
import { useDesigner } from './context';
import { Button } from '../Button';
import { Note } from '../Card';
import { Choice } from '../Field';
import { geometry } from '../../geometry/client';
import { downloadBlob } from '../../outputs/stl';
import { outputFiles, packageZip, type OutputFile } from '../../outputs/package';
import { baseName } from '../../outputs/names';
import type { OutputContext } from '../../outputs/context';
import type { Paper } from '../../outputs/pdf/base';
import type { MeshData } from '../../geometry/kernel';
import { useSettings } from '../../state/settings';
import { useDesign } from '../../state/design';
import { shareUrl } from '../../profiles/share';

const GROUPS: { kind: OutputFile['kind']; title: string; lead: string }[] = [
  {
    kind: '3d',
    title: '3D print files',
    lead: 'Already turned to the recommended placement. Print the fit test first if you can.',
  },
  {
    kind: 'template',
    title: '1:1 fit-check template',
    lead: 'Print on paper at 100% and hold it against the real object before you print in plastic.',
  },
  {
    kind: 'drawing',
    title: 'Dimensioned drawing',
    lead: 'Views with key sizes and tolerances — for a print service or teacher.',
  },
  {
    kind: 'sheet',
    title: 'Sheets',
    lead: 'The print sheet for you, and a plain-language sheet to hand to a library or print service.',
  },
  { kind: 'extra', title: 'Extras', lead: 'Mock-ups, gauges and outlines for CAD or a laser cutter.' },
];

export default function FilesPanel() {
  const { family, params, analysis, build } = useDesigner();
  const location = useDesign((s) => s.use.location);
  const wherePrint = useSettings((s) => s.wherePrint);
  const setSettings = useSettings((s) => s.set);
  const [paper, setPaper] = useState<Paper>(() =>
    typeof navigator !== 'undefined' && /^en-(US|CA)|es-MX/.test(navigator.language) ? 'letter' : 'a4',
  );
  const [fitTest, setFitTest] = useState<MeshData | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const blocked = analysis.issues.some((i) => i.severity === 'error');
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let live = true;
    setFitTest(null);
    if (blocked) return;
    geometry
      .fitTest({ type: 'fitTest', familyId: family.id, params })
      .then((m) => live && setFitTest(m))
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family.id, paramsKey, blocked]);

  const ctx: OutputContext = useMemo(
    () => ({
      family,
      params,
      analysis,
      build,
      paper,
      location,
      wherePrint,
      date: new Date().toISOString().slice(0, 10),
      files: [],
    }),
    [family, params, analysis, build, paper, location, wherePrint],
  );
  const files = useMemo(() => {
    const f = outputFiles(ctx, fitTest);
    ctx.files = f.map((x) => x.name);
    return f;
  }, [ctx, fitTest]);

  const run = async (id: string, fn: () => void) => {
    setBusy(id);
    setError(null);
    // Let the "Preparing…" state paint before heavy work.
    await new Promise((r) => setTimeout(r, 30));
    try {
      fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };
  const download = (f: OutputFile) =>
    run(f.name, () => {
      const data = f.make();
      if (data !== null) downloadBlob(data, f.name, f.mime);
    });

  return (
    <div className="space-y-6">
      {blocked && (
        <Note tone="bad">
          Fix the problems in the Print tab first — files are not offered for a design that will not work.
        </Note>
      )}
      <Choice
        label="Paper size for PDFs"
        value={paper}
        options={[
          { value: 'letter', label: 'US Letter' },
          { value: 'a4', label: 'A4' },
        ]}
        onChange={setPaper}
      />
      <div>
        <Button
          className="w-full"
          disabled={blocked || !build || !!busy}
          onClick={() =>
            run('zip', () =>
              downloadBlob(packageZip(ctx, files), `${baseName(family, params)}.zip`, 'application/zip'),
            )
          }
        >
          {busy === 'zip' ? 'Preparing…' : 'Download everything (.zip)'}
        </Button>
      </div>
      {GROUPS.map((g) => {
        const list = files.filter((f) => f.kind === g.kind);
        if (!list.length) return null;
        return (
          <section key={g.kind} className="space-y-2">
            <h3 className="font-serif text-xl">{g.title}</h3>
            <p className="text-sm text-muted">{g.lead}</p>
            <ul className="flex flex-wrap gap-2">
              {list.map((f) => (
                <li key={f.name}>
                  <Button
                    variant="secondary"
                    disabled={blocked || !!busy || (f.kind === '3d' && !build)}
                    onClick={() => download(f)}
                    aria-label={`Download ${f.label}`}
                  >
                    {busy === f.name ? 'Preparing…' : f.label}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      <section className="space-y-2">
        <h3 className="font-serif text-xl">Request-a-print details</h3>
        <label htmlFor="where" className="block font-semibold">
          Where you hope to print (shown on the request sheet)
        </label>
        <input
          id="where"
          className="tap w-full rounded-lg border border-border bg-surface px-3"
          value={wherePrint}
          onChange={(e) => setSettings({ wherePrint: e.target.value })}
        />
        <p className="text-sm text-muted">
          Tip: ask a library or makerspace near you first, and name it here.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-serif text-xl">Share this design</h3>
        <p className="text-sm text-muted">
          The link holds only the design settings — no names. It is not sent anywhere until you share it.
        </p>
        <Button
          variant="ghost"
          onClick={async () => {
            const url = shareUrl(family.id, params);
            try {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              window.prompt('Copy this link', url);
            }
          }}
        >
          {copied ? 'Link copied' : 'Copy share link'}
        </Button>
      </section>
      {error && <Note tone="bad">{error}</Note>}
    </div>
  );
}
