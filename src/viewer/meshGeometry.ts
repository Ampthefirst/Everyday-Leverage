import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { MeshData } from '../geometry/kernel';
import type { StressFieldFn } from '../strength/field';
import { heatColor } from '../strength/field';

/** Build a render geometry with creased normals (sharp edges stay sharp, curves stay smooth). */
export function toGeometry(mesh: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
  g.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  const creased = toCreasedNormals(g, (35 * Math.PI) / 180);
  g.dispose();
  creased.computeBoundingSphere();
  creased.computeBoundingBox();
  return creased;
}

/** Per-vertex heat colours from the stress field (part-frame mm positions). */
export function applyHeat(g: THREE.BufferGeometry, field: StressFieldFn): void {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const [r, gg, b] = heatColor(field([pos.getX(i), pos.getY(i), pos.getZ(i)]));
    c.setRGB(r, gg, b, THREE.SRGBColorSpace);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}
