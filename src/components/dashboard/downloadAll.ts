/** "Download all designs": a zip with every design's sizes as JSON and as share links. A backup; no account needed. */
import { getFamily } from '../../families';
import type { Project } from '../../state/projects';
import { shareUrl } from '../../profiles/share';
import { disclaimers } from '../../content/disclaimers';
import { downloadBlob } from '../../outputs/stl';

export async function downloadAll(projects: Project[]) {
  const { zipSync, strToU8 } = await import('fflate');
  const designs = projects.map(({ id, name, familyId, params, presetId, step, updatedAt }) => ({
    id,
    name,
    design: getFamily(familyId)?.name ?? familyId,
    familyId,
    params,
    presetId,
    step,
    updatedAt,
    link: shareUrl(familyId, params),
  }));
  const readme = [
    'Everyday Leverage: your saved designs',
    '',
    'designs.json holds each design with its sizes. links.txt has one link per design: open it to load',
    'the design with those sizes in the designer.',
    ...(disclaimers('readme').length ? ['', ...disclaimers('readme')] : []),
    '',
  ].join('\n');
  const zip = zipSync({
    'README.txt': strToU8(readme),
    'designs.json': strToU8(JSON.stringify(designs, null, 2)),
    'links.txt': strToU8(designs.map((d) => `${d.name}\n${d.link}\n`).join('\n')),
  });
  downloadBlob(zip, 'everyday-leverage-designs.zip', 'application/zip');
}
