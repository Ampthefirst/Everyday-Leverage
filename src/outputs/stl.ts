import type { MeshData } from '../geometry/kernel';

/** Binary STL (little-endian): 80-byte header, uint32 count, then 50 bytes per triangle. */
export function toBinarySTL(mesh: MeshData, header = 'Everyday Leverage'): Uint8Array<ArrayBuffer> {
  const tris = mesh.indices.length / 3;
  const buf = new ArrayBuffer(84 + tris * 50);
  const dv = new DataView(buf);
  const head = new TextEncoder().encode(header.slice(0, 79));
  new Uint8Array(buf, 0, 80).set(head);
  dv.setUint32(80, tris, true);
  const p = mesh.positions;
  let o = 84;
  for (let t = 0; t < tris; t++) {
    const a = mesh.indices[t * 3] * 3;
    const b = mesh.indices[t * 3 + 1] * 3;
    const c = mesh.indices[t * 3 + 2] * 3;
    const ux = p[b] - p[a],
      uy = p[b + 1] - p[a + 1],
      uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a],
      vy = p[c + 1] - p[a + 1],
      vz = p[c + 2] - p[a + 2];
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    dv.setFloat32(o, nx, true);
    dv.setFloat32(o + 4, ny, true);
    dv.setFloat32(o + 8, nz, true);
    o += 12;
    for (const i of [a, b, c]) {
      dv.setFloat32(o, p[i], true);
      dv.setFloat32(o + 4, p[i + 1], true);
      dv.setFloat32(o + 8, p[i + 2], true);
      o += 12;
    }
    dv.setUint16(o, 0, true);
    o += 2;
  }
  return new Uint8Array(buf);
}

/** Rotate + drop to the bed so the file opens in the recommended print orientation. */
export function orientMesh(mesh: MeshData, rotationDeg: [number, number, number]): MeshData {
  const [rx, ry, rz] = rotationDeg.map((d) => (d * Math.PI) / 180);
  const cx = Math.cos(rx),
    sx = Math.sin(rx),
    cy = Math.cos(ry),
    sy = Math.sin(ry),
    cz = Math.cos(rz),
    sz = Math.sin(rz);
  const R = [
    [cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz],
    [cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz],
    [-sy, sx * cy, cx * cy],
  ];
  const n = mesh.positions.length / 3;
  const out = new Float32Array(mesh.positions.length);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) {
    const x = mesh.positions[i * 3],
      y = mesh.positions[i * 3 + 1],
      z = mesh.positions[i * 3 + 2];
    for (let k = 0; k < 3; k++) {
      const v = R[k][0] * x + R[k][1] * y + R[k][2] * z;
      out[i * 3 + k] = v;
      min[k] = Math.min(min[k], v);
      max[k] = Math.max(max[k], v);
    }
  }
  // Centre on X/Y, sit on Z = 0.
  const off = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, min[2]];
  for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) out[i * 3 + k] -= off[k];
  return {
    ...mesh,
    positions: out,
    bbox: {
      min: [min[0] - off[0], min[1] - off[1], 0],
      max: [max[0] - off[0], max[1] - off[1], max[2] - off[2]],
    },
  };
}

export function downloadBlob(data: BlobPart | Uint8Array, filename: string, type: string) {
  const blob = new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  // Lets the step strip mark "Print" as reached.
  window.dispatchEvent(new CustomEvent('el:download', { detail: filename }));
}
