import { zipSync, strToU8 } from 'fflate';
import type { MeshData } from '../geometry/kernel';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 3MF package (unit = millimetre) with one object per mesh and metadata (family, params, settings). */
export function toThreeMF(meshes: MeshData[], metadata: Record<string, string>): Uint8Array<ArrayBuffer> {
  const objects: string[] = [];
  const items: string[] = [];
  meshes.forEach((m, k) => {
    const id = k + 1;
    const n = m.positions.length / 3;
    const v: string[] = [];
    for (let i = 0; i < n; i++)
      v.push(
        `<vertex x="${m.positions[i * 3].toFixed(4)}" y="${m.positions[i * 3 + 1].toFixed(4)}" z="${m.positions[i * 3 + 2].toFixed(4)}"/>`,
      );
    const t: string[] = [];
    for (let i = 0; i < m.indices.length; i += 3)
      t.push(`<triangle v1="${m.indices[i]}" v2="${m.indices[i + 1]}" v3="${m.indices[i + 2]}"/>`);
    objects.push(
      `<object id="${id}" name="${esc(m.name)}" type="model"><mesh><vertices>${v.join('')}</vertices><triangles>${t.join('')}</triangles></mesh></object>`,
    );
    // Place pieces side by side on the bed.
    const dx =
      k === 0 ? 0 : meshes.slice(0, k).reduce((a, mm) => a + (mm.bbox.max[0] - mm.bbox.min[0]) + 10, 0);
    items.push(`<item objectid="${id}" transform="1 0 0 0 1 0 0 0 1 ${dx.toFixed(3)} 0 0"/>`);
  });
  const meta = Object.entries(metadata)
    .map(([k, val]) => `<metadata name="${esc(k)}">${esc(val)}</metadata>`)
    .join('');
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:everyday-leverage="https://github.com/Ampthefirst/Everyday-Leverage/3mf">${meta}<resources>${objects.join('')}</resources><build>${items.join('')}</build></model>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
  return zipSync({
    '[Content_Types].xml': strToU8(contentTypes),
    _rels: { '.rels': strToU8(rels) },
    '3D': { '3dmodel.model': strToU8(model) },
  }) as Uint8Array<ArrayBuffer>;
}
