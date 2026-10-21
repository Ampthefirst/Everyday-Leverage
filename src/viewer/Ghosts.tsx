import { useMemo } from 'react';
import * as THREE from 'three';
import type { GhostObject } from '../families/types';

const deg = (d: number) => (d * Math.PI) / 180;

function useGhostMaterial(color: string, opacity = 0.32) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        roughness: 0.6,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    [color, opacity],
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

function Capsule({ a, b, r, mat }: { a: THREE.Vector3; b: THREE.Vector3; r: number; mat: THREE.Material }) {
  const { pos, quat, len } = useMemo(() => {
    const d = new THREE.Vector3().subVectors(b, a);
    const len = d.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return { pos: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), quat, len };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={mat}>
      <capsuleGeometry args={[r, Math.max(0.01, len), 6, 12]} />
    </mesh>
  );
}

/** Stylised hand built from capsules, scaled by hand breadth, mirrored for the left hand. */
function Hand({ o, breadth }: { o: GhostObject; breadth: number }) {
  const mat = useGhostMaterial('#e0a17a', 0.38);
  const s = breadth / 85;
  const grip = o.size.grip ?? 32;
  const pose = o.pose ?? 'grip';
  const fingers = useMemo(() => {
    const out: { a: THREE.Vector3; b: THREE.Vector3; r: number }[] = [];
    const fr = 9 * s;
    const lens = [44, 50, 47, 38].map((l) => l * s);
    const zs = [1.5, 0.5, -0.5, -1.5].map((k) => k * 20 * s);
    if (pose === 'grip' || pose === 'hook') {
      // Fingers wrap around a cylinder of diameter `grip` on the Z axis, palm on the −X side.
      const R = grip / 2 + fr;
      lens.forEach((L, i) => {
        const z = zs[i];
        const steps = 3;
        let prev = new THREE.Vector3(-R, 0, z);
        const sweep = Math.min(Math.PI * 1.25, L / R);
        for (let k = 1; k <= steps; k++) {
          const a = Math.PI + (sweep * k) / steps;
          const pt = new THREE.Vector3(R * Math.cos(a), R * Math.sin(a), z);
          out.push({ a: prev, b: pt, r: fr * (1 - k * 0.06) });
          prev = pt;
        }
      });
      // thumb across the front
      out.push({
        a: new THREE.Vector3(-R, -R * 0.6, zs[0] + 18 * s),
        b: new THREE.Vector3(R * 0.2, -R * 1.05, zs[0] + 6 * s),
        r: fr * 1.05,
      });
    } else if (pose === 'palm') {
      lens.forEach((L, i) =>
        out.push({
          a: new THREE.Vector3(zs[i], 0, -10 * s),
          b: new THREE.Vector3(zs[i] * 1.1, L, -10 * s),
          r: fr,
        }),
      );
      out.push({
        a: new THREE.Vector3(-45 * s, -20 * s, -10 * s),
        b: new THREE.Vector3(-70 * s, 10 * s, -10 * s),
        r: fr * 1.1,
      });
    } else if (pose === 'point' || pose === 'pinch') {
      out.push({ a: new THREE.Vector3(0, 0, -50 * s), b: new THREE.Vector3(0, 0, -50 * s + lens[0]), r: fr });
      out.push({
        a: new THREE.Vector3(-15 * s, -20 * s, -50 * s),
        b: new THREE.Vector3(-8 * s, -14 * s, pose === 'pinch' ? -6 * s : -30 * s),
        r: fr * 1.1,
      });
    }
    return out;
  }, [s, grip, pose]);
  const palm =
    pose === 'grip' || pose === 'hook'
      ? {
          size: [26 * s, 80 * s, 85 * s] as [number, number, number],
          pos: [-(grip / 2 + 9 * s) - 16 * s, 25 * s, 0] as [number, number, number],
        }
      : pose === 'palm'
        ? {
            size: [85 * s, 90 * s, 24 * s] as [number, number, number],
            pos: [0, -45 * s, -10 * s] as [number, number, number],
          }
        : {
            size: [80 * s, 26 * s, 90 * s] as [number, number, number],
            pos: [-20 * s, -30 * s, -100 * s] as [number, number, number],
          };
  return (
    <group scale={[o.hand === 'left' ? -1 : 1, 1, 1]}>
      <Box size={palm.size} pos={palm.pos} mat={mat} />
      {fingers.map((f, i) => (
        <Capsule key={i} a={f.a} b={f.b} r={f.r} mat={mat} />
      ))}
    </group>
  );
}

function GhostShape({ o, breadth }: { o: GhostObject; breadth: number }) {
  const glass = useGhostMaterial('#7dd3fc', 0.22);
  const metal = useGhostMaterial('#cbd5e1', 0.42);
  const wood = useGhostMaterial('#d6b48a', 0.3);
  const plastic = useGhostMaterial('#f9a8d4', 0.35);
  const sz = o.size;
  switch (o.kind) {
    case 'jar': {
      const lid = sz.lid ?? 70;
      const h = sz.height ?? 100;
      const lidH = sz.lidH ?? 12;
      return (
        <group>
          <ZCyl r={lid * 0.52} h={h - lidH} mat={glass} />
          <ZCyl r={lid / 2} h={lidH} z0={h - lidH} mat={metal} />
        </group>
      );
    }
    case 'bottle': {
      const d = sz.cap ?? 30;
      return (
        <group>
          <ZCyl r={d * 1.3} h={sz.height ?? 150} mat={glass} />
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
          <Box size={[80, 80, 6]} pos={[0, 0, -3]} mat={plastic} />
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
          <Box size={[700, 30, 900]} pos={[L / 2, -60, -150]} mat={wood} />
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
