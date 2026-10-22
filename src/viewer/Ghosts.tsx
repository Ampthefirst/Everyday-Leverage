import { createContext, useContext, useMemo } from 'react';
import { ArticulatedHand } from './Hand';
import * as THREE from 'three';
import type { GhostObject } from '../families/types';

const deg = (d: number) => (d * Math.PI) / 180;

/** Studio mode renders context objects as real materials (for product renders), not translucent ghosts. */
export const GhostStudio = createContext(false);

type Finish = 'glass' | 'metal' | 'wood' | 'plastic' | 'skin' | 'mannequin';

function studioMaterial(finish: Finish): THREE.Material {
  switch (finish) {
    case 'glass':
      // Clear glass on a transparent canvas: mostly reflection, a little body.
      return new THREE.MeshPhysicalMaterial({ color: '#dff3f5', roughness: 0.03, metalness: 0, transparent: true, opacity: 0.28, envMapIntensity: 1.6, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
    case 'metal':
      return new THREE.MeshPhysicalMaterial({ color: '#d7dce2', metalness: 1, roughness: 0.16, envMapIntensity: 1.3 });
    case 'wood':
      return new THREE.MeshPhysicalMaterial({ color: '#8a6440', roughness: 0.7 });
    case 'mannequin':
      return new THREE.MeshPhysicalMaterial({ color: '#e9e7e3', roughness: 0.5, clearcoat: 0.15, clearcoatRoughness: 0.6 });
    case 'skin':
      return new THREE.MeshPhysicalMaterial({ color: '#c99a7c', roughness: 0.6, sheen: 0.3 });
    default:
      // Context plastic (switch plates, zipper tape) stays dark so the printed part leads.
      return new THREE.MeshPhysicalMaterial({ color: '#2b2f38', roughness: 0.55 });
  }
}

function useGhostMaterial(color: string, opacity = 0.32, finish: Finish = 'plastic') {
  const studio = useContext(GhostStudio);
  return useMemo(
    () =>
      studio
        ? studioMaterial(finish)
        : new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        roughness: 0.6,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    [color, opacity, finish, studio],
  );
}

/** Cylinder along +Z from z0 to z0+h (three's cylinder is along Y, so rotate). */
function ZCyl({
  r,
  r2,
  h,
  z0 = 0,
  x = 0,
  y = 0,
  mat,
  seg = 40,
}: {
  r: number;
  r2?: number;
  h: number;
  z0?: number;
  x?: number;
  y?: number;
  mat: THREE.Material;
  seg?: number;
}) {
  return (
    <mesh position={[x, y, z0 + h / 2]} rotation={[Math.PI / 2, 0, 0]} material={mat}>
      <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    </mesh>
  );
}

function Box({
  size,
  pos,
  mat,
  rot,
}: {
  size: [number, number, number];
  pos: [number, number, number];
  mat: THREE.Material;
  rot?: [number, number, number];
}) {
  return (
    <mesh position={pos} rotation={rot} material={mat}>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Articulated mannequin hand, scaled by hand breadth, mirrored for the left hand. */
function Hand({ o, breadth }: { o: GhostObject; breadth: number }) {
  const mat = useGhostMaterial('#ece9e4', 0.34, 'mannequin');
  return <ArticulatedHand breadth={breadth} pose={o.pose ?? 'grip'} gripD={o.size.grip ?? 32} side={o.hand ?? 'right'} mat={mat} />;
}

function GhostShape({ o, breadth }: { o: GhostObject; breadth: number }) {
  const studio = useContext(GhostStudio);
  const glass = useGhostMaterial('#7dd3fc', 0.22, 'glass');
  const metal = useGhostMaterial('#cbd5e1', 0.42, 'metal');
  const wood = useGhostMaterial('#d6b48a', 0.3, 'wood');
  const plastic = useGhostMaterial('#f9a8d4', 0.35, 'plastic');
  const jam = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#7a0f1e', roughness: 0.25, clearcoat: 0.6 }), []);
  const sz = o.size;
  switch (o.kind) {
    case 'jar': {
      const lid = sz.lid ?? 70;
      const h = sz.height ?? 100;
      const lidH = sz.lidH ?? 12;
      return (
        <group>
          {studio && <ZCyl r={lid * 0.48} h={(h - lidH) * 0.82} z0={1.5} mat={jam} />}
          <ZCyl r={lid * 0.52} h={h - lidH} mat={glass} />
          <ZCyl r={lid / 2} h={lidH} z0={h - lidH} mat={metal} />
        </group>
      );
    }
    case 'bottle': {
      const d = sz.cap ?? 30;
      return (
        <group>
          <ZCyl r={d * 0.75} h={sz.height ?? 150} mat={glass} />
          <ZCyl r={d / 2} h={14} z0={sz.height ?? 150} mat={plastic} />
        </group>
      );
    }
    case 'utensil':
    case 'pen':
    case 'toothbrush': {
      const w = sz.w ?? 8;
      const t = sz.h ?? w;
      const L = sz.length ?? 180;
      return (
        <group>
          <Box size={[w, t, L]} pos={[0, 0, L / 2]} mat={metal} />
          {o.kind === 'utensil' && (
            <mesh position={[0, 0, -18]} scale={[22, 6, 32]} material={metal}>
              <sphereGeometry args={[0.5, 24, 16]} />
            </mesh>
          )}
          {o.kind === 'toothbrush' && <Box size={[w * 0.8, 12, 26]} pos={[0, 5, -13]} mat={plastic} />}
          {o.kind === 'pen' && <ZCyl r={w * 0.3} r2={w / 2} h={18} z0={-18} mat={metal} />}
        </group>
      );
    }
    case 'key': {
      const w = sz.w ?? 24;
      const t = sz.t ?? 2.5;
      return (
        <group>
          <Box size={[w, t, w * 0.9]} pos={[0, 0, 0]} mat={metal} />
          <Box size={[w * 0.32, t, 45]} pos={[0, 0, -w * 0.45 - 22]} mat={metal} />
        </group>
      );
    }
    case 'knob':
      return <ZCyl r={(sz.d ?? 35) / 2} h={sz.h ?? 20} mat={wood} />;
    case 'stoveKnob':
      return (
        <group>
          <ZCyl r={(sz.d ?? 40) / 2} h={sz.h ?? 22} mat={plastic} />
          <Box size={[60, 60, 4]} pos={[0, 0, -2]} mat={metal} />
        </group>
      );
    case 'faucetCross': {
      const s = sz.span ?? 50;
      return (
        <group>
          <Box size={[s, s * 0.2, sz.h ?? 18]} pos={[0, 0, (sz.h ?? 18) / 2]} mat={metal} />
          <Box size={[s * 0.2, s, sz.h ?? 18]} pos={[0, 0, (sz.h ?? 18) / 2]} mat={metal} />
          <ZCyl r={10} h={40} z0={-40} mat={metal} />
        </group>
      );
    }
    case 'faucetLever':
      return <Box size={[sz.length ?? 80, 14, 10]} pos={[(sz.length ?? 80) / 2, 0, 5]} mat={metal} />;
    case 'drawer':
      return (
        <group>
          <Box size={[200, 120, 18]} pos={[0, 0, -9]} mat={wood} />
        </group>
      );
    case 'zipper':
      return (
        <group>
          <Box size={[30, 80, 1.5]} pos={[0, -20, -2]} mat={plastic} />
          {studio &&
            Array.from({ length: 14 }, (_, i) => <Box key={i} size={[7, 2.4, 2.4]} pos={[0, -28 - i * 4, -1.2]} mat={metal} />)}
          <Box size={[sz.w ?? 8, sz.l ?? 20, sz.t ?? 2]} pos={[0, 0, 0]} mat={metal} />
        </group>
      );
    case 'canTab':
      return (
        <group>
          <ZCyl r={33} h={115} z0={-115} mat={metal} />
          <Box size={[20, 26, 1]} pos={[0, 8, 0.5]} mat={metal} />
        </group>
      );
    case 'button':
      return (
        <group>
          <Box size={studio ? [(sz.d ?? 12) * 2.6, (sz.d ?? 12) * 2.6, 6] : [80, 80, 6]} pos={[0, 0, -3]} mat={plastic} />
          <ZCyl r={(sz.d ?? 12) / 2} h={3} mat={metal} />
        </group>
      );
    case 'doorLever': {
      // Lever along +X from its rose; the door is a wall behind it (−Y).
      const d = sz.d ?? 18;
      const L = sz.length ?? 120;
      return (
        <group>
          <mesh position={[0, -40, 0]} rotation={[0, 0, 0]} material={metal}>
            <cylinderGeometry args={[26, 26, 10, 40]} />
          </mesh>
          <mesh position={[0, -20, 0]} material={metal}>
            <cylinderGeometry args={[8, 8, 40, 24]} />
          </mesh>
          <mesh position={[L / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={metal}>
            <cylinderGeometry args={[d / 2, d / 2, L, 28]} />
          </mesh>
          {!studio && <Box size={[360, 20, 420]} pos={[L / 2, -60, -120]} mat={wood} />}
        </group>
      );
    }
    case 'tool': {
      const af = sz.af ?? 6.35;
      return (
        <group>
          <ZCyl r={af / Math.sqrt(3)} h={sz.length ?? 60} mat={metal} seg={6} />
        </group>
      );
    }
    case 'hand':
      return <Hand o={o} breadth={breadth} />;
  }
}

export function Ghost({ o, breadth }: { o: GhostObject; breadth: number }) {
  const r = o.rotation ?? [0, 0, 0];
  return (
    <group position={o.position} rotation={[deg(r[0]), deg(r[1]), deg(r[2])]}>
      <GhostShape o={o} breadth={breadth} />
    </group>
  );
}
