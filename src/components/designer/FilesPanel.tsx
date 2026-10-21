import { useState } from 'react';
import { useDesigner } from './context';
import { Button } from '../Button';
import { Note } from '../Card';
import { geometry } from '../../geometry/client';
import { downloadBlob, orientMesh, toBinarySTL } from '../../outputs/stl';
import { baseName } from '../../outputs/names';

export function FilesPanel() {
  const { family, params, analysis, build } = useDesigner();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const blocked = analysis.issues.some((i) => i.severity === 'error');
  const name = baseName(family, params);
  const rot = analysis.orientation.candidate.rotation;

  const run = async (id: string, fn: () => Promise<void> | void) => {
    setBusy(id);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {blocked && <Note tone="bad">Fix the problems in the Print tab before downloading print files.</Note>}
      <section className="space-y-3">
        <h3 className="text-lg font-bold">3D print files</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!build || blocked || !!busy}
            onClick={() =>
              run('stl', () => {
                if (!build) return;
                const meshes = build.pieces.length ? build.pieces : [build.mesh];
                meshes.forEach((m, i) =>
                  downloadBlob(
                    toBinarySTL(orientMesh(m, rot), `${name} ${m.name}`),
                    `${name}${meshes.length > 1 ? `-part${i + 1}` : ''}.stl`,
                    'model/stl',
                  ),
                );
              })
            }
          >
            Download STL
          </Button>
          <Button
            variant="secondary"
            disabled={blocked || !!busy}
            onClick={() =>
              run('fit', async () => {
                const m = await geometry.fitTest({ type: 'fitTest', familyId: family.id, params });
                downloadBlob(
                  toBinarySTL(orientMesh(m, [0, 0, 0]), `${name} fit test`),
                  `${name}-fit-test.stl`,
                  'model/stl',
                );
              })
            }
          >
            {busy === 'fit' ? 'Building…' : 'Fit-test mini-print'}
          </Button>
        </div>
        <p className="text-sm text-muted">
          The STL opens already turned to the recommended placement. The fit test is a thin slice of the part
          that has to fit — print it first.
        </p>
      </section>
      {error && <Note tone="bad">{error}</Note>}
    </div>
  );
}
