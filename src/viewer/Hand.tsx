import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import {
  gripCylinder,
  handSpec,
  indexTip,
  pinchSolution,
  poseAngles,
  type HandPose,
  type HandSpec,
} from './handModel';

const rad = (d: number) => (d * Math.PI) / 180;
/** Gap between segments at each joint, as a fraction of segment width. */
const GAP = 0.12;

/** One phalanx along +Y from 0 to `len`: a tapered, slightly flattened rounded cylinder with a joint gap. */
function Phalanx({
  len,
  w0,
  w1,
  mat,
  cap = false,
}: {
  len: number;
  w0: number;
  w1: number;
  mat: THREE.Material;
  cap?: boolean;
}) {
  const gap = w0 * GAP;
  const body = Math.max(0.5, len - gap - (w0 + w1) / 4);
  return (
    <group scale={[1, 1, 0.86]}>
      <mesh position={[0, gap / 2 + w0 / 4 + body / 2, 0]} material={mat}>
        <cylinderGeometry args={[w1 / 2, w0 / 2, body, 28]} />
      </mesh>
      <mesh position={[0, gap / 2 + w0 / 4, 0]} material={mat}>
        <sphereGeometry args={[w0 / 2, 28, 16]} />
      </mesh>
      <mesh position={[0, gap / 2 + w0 / 4 + body, 0]} material={mat} scale={cap ? [1, 1.15, 1] : [1, 1, 1]}>
        <sphereGeometry args={[w1 / 2, 28, 16]} />
      </mesh>
    </group>
  );
}

/** A chain of three phalanges; each joint flexes about its local X axis toward the palm (−Z). */
function Chain({
  lengths,
  width,
  flex,
  mat,
}: {
  lengths: [number, number, number];
  width: number;
  flex: [number, number, number];
  mat: THREE.Material;
}) {
  const w = [width, width * 0.9, width * 0.82, width * 0.72];
  return (
    <group rotation={[-rad(flex[0]), 0, 0]}>
      <Phalanx len={lengths[0]} w0={w[0]} w1={w[1]} mat={mat} />
      <group position={[0, lengths[0], 0]} rotation={[-rad(flex[1]), 0, 0]}>
        <Phalanx len={lengths[1]} w0={w[1]} w1={w[2]} mat={mat} />
        <group position={[0, lengths[1], 0]} rotation={[-rad(flex[2]), 0, 0]}>
          <Phalanx len={lengths[2]} w0={w[2]} w1={w[3]} mat={mat} cap />
        </group>
      </group>
    </group>
  );
}

/** The hand in its canonical frame: wrist at origin, fingers +Y, palmar side −Z, thumb on −X. */
function CanonicalHand({
  spec,
  pose,
  gripD,
  mat,
}: {
  spec: HandSpec;
  pose: HandPose;
  gripD: number;
  mat: THREE.Material;
}) {
  const a = poseAngles(pose, spec, gripD);
  const { palm, wrist, thumb } = spec;
  return (
    <group>
      {/* Palm: rounded slab, slightly wider at the knuckles. */}
      <RoundedBox
        args={[palm.width, palm.length - 8, palm.thickness]}
        radius={palm.thickness * 0.42}
        smoothness={5}
        position={[0, (palm.length - 8) / 2 + 4, 0]}
        material={mat}
      />
      <RoundedBox
        args={[palm.width * 1.04, palm.length * 0.32, palm.thickness * 0.96]}
        radius={palm.thickness * 0.4}
        smoothness={5}
        position={[0, palm.length * 0.8, 0]}
        material={mat}
      />
      {/* Wrist: a capped cylinder like a mannequin's wrist joint. */}
      <mesh position={[0, -wrist.length / 2 + 6, 0]} scale={[1.18, 1, 0.82]} material={mat}>
        <cylinderGeometry args={[wrist.radius, wrist.radius * 0.94, wrist.length, 36]} />
      </mesh>
      <mesh position={[0, -wrist.length + 6, 0]} scale={[1.18, 0.6, 0.82]} material={mat}>
        <sphereGeometry args={[wrist.radius * 0.94, 32, 16]} />
      </mesh>
      {spec.fingers.map((f, i) => (
        <group key={f.name} position={f.base} rotation={[0, 0, -rad(f.splay + a.fingers[i].splay)]}>
          <Chain lengths={f.lengths} width={f.width} flex={a.fingers[i].flex} mat={mat} />
        </group>
      ))}
      {/* Thumb: swings toward −X (abduction), across the palm (opposition), with an axial roll. */}
      <group
        position={thumb.base}
        rotation={new THREE.Euler(-rad(a.thumb.oppose), rad(a.thumb.roll), rad(a.thumb.abduct), 'ZXY')}
      >
        <Chain lengths={thumb.lengths} width={thumb.width} flex={a.thumb.flex} mat={mat} />
      </group>
    </group>
  );
}

/**
 * Places the canonical hand in the frame each pose uses in the families' ghost specs:
 * - grip / hook: the handle runs along Z through the origin, palm on the −X side, wrist toward +Y;
 * - palm: fingers along +Y from y ≈ 0, palm below, palmar side −Z;
 * - point: the index fingertip pad at the origin, the finger pointing +Z, palmar side +Y;
 * - pinch: the same frame, with the held object (between index and thumb pads) at the origin.
 */
export function ArticulatedHand({
  breadth = 85,
  pose = 'grip',
  gripD = 32,
  side = 'right',
  mat,
}: {
  breadth?: number;
  pose?: HandPose;
  gripD?: number;
  side?: 'left' | 'right';
  mat: THREE.Material;
}) {
  const spec = useMemo(() => handSpec(breadth), [breadth]);
  const { outer, inner } = useMemo(() => {
    if (pose === 'grip' || pose === 'hook') {
      const cyl = gripCylinder(spec, gripD);
      // canonical X → −Z (index finger on +Z), Y → −Y (wrist toward +Y), Z → −X (palm on −X)
      const m = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(-1, 0, 0),
      );
      return { outer: m, inner: new THREE.Vector3(0, -cyl.y, -cyl.z) };
    }
    if (pose === 'palm')
      return { outer: new THREE.Matrix4(), inner: new THREE.Vector3(0, -spec.palm.length, -10 * spec.scale) };
    // point / pinch: canonical +Y → +Z, palmar −Z → +Y
    const m = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    const [x, y, z] =
      pose === 'pinch' ? pinchSolution(spec).point : indexTip(spec, poseAngles(pose, spec, gripD));
    return { outer: m, inner: new THREE.Vector3(-x, -y, -z) };
  }, [spec, pose, gripD]);
  // A see-through hand would show every overlapping segment inside it. A depth-only pass first means
  // only the outer surface is drawn, so it reads as one translucent shell.
  // Both passes sit in the transparent queue (after the opaque part), so the part still shows through.
  const depthMat = useMemo(
    () => new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, depthWrite: true }),
    [],
  );
  const seeThrough = mat.transparent && mat.opacity < 1;
  return (
    <group scale={[side === 'left' ? -1 : 1, 1, 1]}>
      <group matrix={outer} matrixAutoUpdate={false}>
        <group position={inner}>
          {seeThrough && (
            <group renderOrder={1}>
              <CanonicalHand spec={spec} pose={pose} gripD={gripD} mat={depthMat} />
            </group>
          )}
          <group renderOrder={2}>
            <CanonicalHand spec={spec} pose={pose} gripD={gripD} mat={mat} />
          </group>
        </group>
      </group>
    </group>
  );
}
