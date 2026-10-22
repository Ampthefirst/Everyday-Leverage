import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { MeshData } from '../geometry/kernel';
import type { SectionResult } from '../geometry/protocol';
import type { AnimationSpec, GhostSpec, Pose } from '../families/types';
import type { StressFieldFn } from '../strength/field';
import type { Vec3 } from '../types/geom';
import { applyHeat, toGeometry } from './meshGeometry';
import { Ghost, GhostStudio } from './Ghosts';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { HandClosure } from './Hand';

const deg = (d: number) => (d * Math.PI) / 180;
const VIEW_DIR = new THREE.Vector3(0.65, 0.55, 0.75).normalize();

export interface ViewerProps {
  mesh: MeshData | null;
  /** The part's filament colour; high-contrast mode overrides it with the theme's part colour. */
  partColor?: string;
  pieces: MeshData[];
  field: StressFieldFn | null;
  heat: boolean;
  ghost: GhostSpec | null;
  showGhost: boolean;
  section: { axis: 'x' | 'y' | 'z'; offset: number; data: SectionResult | null } | null;
  displayRotation?: Vec3;
  mirror: boolean;
  animation: { spec: AnimationSpec; step: number; reduced: boolean } | null;
  handBreadth: number;
  resetKey: number;
  label: string;
  /** Keyboard / button camera commands (orbit and zoom without a mouse). */
  camera?: { c: CameraCommand; n: number } | null;
}

export type CameraCommand = 'left' | 'right' | 'up' | 'down' | 'in' | 'out';

/** Applies button-driven orbit/zoom steps to the camera around the controls' target. */
function CameraCommands({
  cmd,
  controls,
}: {
  cmd: ViewerProps['camera'];
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  useEffect(() => {
    if (!cmd || !controls.current) return;
    const target = controls.current.target;
    const offset = camera.position.clone().sub(target);
    const sph = new THREE.Spherical().setFromVector3(offset);
    const step = Math.PI / 12;
    if (cmd.c === 'left') sph.theta -= step;
    if (cmd.c === 'right') sph.theta += step;
    if (cmd.c === 'up') sph.phi = Math.max(0.15, sph.phi - step);
    if (cmd.c === 'down') sph.phi = Math.min(Math.PI - 0.15, sph.phi + step);
    if (cmd.c === 'in') sph.radius *= 0.8;
    if (cmd.c === 'out') sph.radius *= 1.25;
    camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(sph));
    camera.lookAt(target);
    controls.current.update();
  }, [cmd, camera, controls]);
  return null;
}

function readCssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function poseMatrix(p: Pose | undefined, t: number): THREE.Matrix4 {
  const m = new THREE.Matrix4();
  if (!p) return m;
  if (p.rotate) {
    const { axis, pivot, deg: d } = p.rotate;
    const tr = new THREE.Matrix4().makeTranslation(pivot[0], pivot[1], pivot[2]);
    const rot = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(...axis).normalize(), deg(d * t));
    const back = new THREE.Matrix4().makeTranslation(-pivot[0], -pivot[1], -pivot[2]);
    m.multiply(tr).multiply(rot).multiply(back);
  }
  if (p.translate) {
    const tt = new THREE.Matrix4().makeTranslation(
      p.translate[0] * t,
      p.translate[1] * t,
      p.translate[2] * t,
    );
    m.premultiply(tt);
  }
  return m;
}

/** Animated part pose: eases from the previous step to the current one. */
function useAnimatedPose(animation: ViewerProps['animation']) {
  const partRef = useRef<THREE.Group>(null);
  const ghostRefs = useRef<(THREE.Group | null)[]>([]);
  const state = useRef({ from: 0, to: 0, start: 0 });
  useEffect(() => {
    const s = state.current;
    s.from = s.to;
    s.to = animation?.step ?? -1;
    s.start = performance.now();
  }, [animation?.step]);
  useFrame(() => {
    if (!partRef.current) return;
    const spec = animation?.spec;
    const s = state.current;
    const apply = (m: THREE.Matrix4, moving: Set<number>) => {
      partRef.current!.matrix.copy(m);
      ghostRefs.current.forEach((g, i) => {
        if (!g) return;
        g.matrix.copy(moving.has(i) ? m : new THREE.Matrix4());
      });
    };
    if (!spec || s.to < 0) {
      apply(new THREE.Matrix4(), new Set());
      return;
    }
    const dur = animation!.reduced ? 1 : 900;
    const k = Math.min(1, (performance.now() - s.start) / dur);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const cur = spec.steps[s.to];
    const prev = s.from >= 0 ? spec.steps[s.from] : undefined;
    // Interpolate translation and rotation amounts between the two absolute poses.
    const lerpPose: Pose = {};
    const pt = prev?.part.translate ?? [0, 0, 0];
    const ct = cur?.part.translate ?? [0, 0, 0];
    lerpPose.translate = [
      pt[0] + (ct[0] - pt[0]) * e,
      pt[1] + (ct[1] - pt[1]) * e,
      pt[2] + (ct[2] - pt[2]) * e,
    ];
    const rot = cur?.part.rotate ?? prev?.part.rotate;
    if (rot) {
      const pd = prev?.part.rotate ? prev.part.rotate.deg : 0;
      const cd = cur?.part.rotate ? cur.part.rotate.deg : 0;
      lerpPose.rotate = { ...rot, deg: pd + (cd - pd) * e };
    }
    apply(poseMatrix(lerpPose, 1), new Set(cur?.ghosts ?? []));
  });
  return { partRef, ghostRefs };
}

function Part({
  mesh,
  field,
  heat,
  clip,
  color,
}: {
  mesh: MeshData;
  field: StressFieldFn | null;
  heat: boolean;
  clip: THREE.Plane[];
  color: string;
}) {
  const geom = useMemo(() => toGeometry(mesh), [mesh]);
  useEffect(() => {
    if (heat && field) applyHeat(geom, field);
    else geom.deleteAttribute('color');
  }, [geom, field, heat]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <group>
      <mesh geometry={geom} castShadow receiveShadow>
        <meshStandardMaterial
          key={heat ? 'heat' : 'plain'}
          color={heat ? '#ffffff' : color}
          vertexColors={heat}
          roughness={0.55}
          metalness={0.05}
          envMapIntensity={0.35}
          clippingPlanes={clip}
          clipShadows
        />
      </mesh>
      {clip.length > 0 && (
        <mesh geometry={geom}>
          <meshBasicMaterial color="#64748b" side={THREE.BackSide} clippingPlanes={clip} />
        </mesh>
      )}
    </group>
  );
}

let hatchTex: THREE.CanvasTexture | null = null;
function hatchTexture() {
  if (hatchTex) return hatchTex;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fde68a';
  g.fillRect(0, 0, 32, 32);
  g.strokeStyle = '#b45309';
  g.lineWidth = 3;
  for (let i = -32; i < 64; i += 10) {
    g.beginPath();
    g.moveTo(i, 32);
    g.lineTo(i + 32, 0);
    g.stroke();
  }
  hatchTex = new THREE.CanvasTexture(c);
  hatchTex.wrapS = hatchTex.wrapT = THREE.RepeatWrapping;
  hatchTex.repeat.set(1 / 4, 1 / 4);
  return hatchTex;
}

function shapesFrom(polys: [number, number][][]): THREE.Shape[] {
  const path = new THREE.ShapePath();
  for (const poly of polys) {
    if (poly.length < 3) continue;
    path.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) path.lineTo(poly[i][0], poly[i][1]);
    path.currentPath?.closePath();
  }
  return path.toShapes();
}

/** Section overlay: solid shell ring with hatched infill, drawn on the cut plane. */
function SectionOverlay({
  data,
  axis,
  offset,
}: {
  data: SectionResult;
  axis: 'x' | 'y' | 'z';
  offset: number;
}) {
  const { outerGeo, innerGeo } = useMemo(() => {
    const outerGeo = new THREE.ShapeGeometry(shapesFrom(data.outer));
    const innerGeo = new THREE.ShapeGeometry(shapesFrom(data.inner));
    // world UVs so the hatch is uniform
    for (const g of [outerGeo, innerGeo]) {
      const p = g.getAttribute('position');
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] = p.getX(i);
        uv[i * 2 + 1] = p.getY(i);
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
    return { outerGeo, innerGeo };
  }, [data]);
  useEffect(
    () => () => {
      outerGeo.dispose();
      innerGeo.dispose();
    },
    [outerGeo, innerGeo],
  );
  // Map plane coords (u, v) back to the part frame.
  const matrix = useMemo(() => {
    const m = new THREE.Matrix4();
    if (axis === 'z') m.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, offset + 0.05, 0, 0, 0, 1);
    if (axis === 'x') m.set(0, 0, 1, offset + 0.05, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);
    if (axis === 'y') m.set(1, 0, 0, 0, 0, 0, 1, offset + 0.05, 0, 1, 0, 0, 0, 0, 0, 1);
    return m;
  }, [axis, offset]);
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <mesh geometry={outerGeo}>
        <meshBasicMaterial color="#1d4ed8" side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh geometry={innerGeo} position={[0, 0, 0.02]}>
        <meshBasicMaterial
          map={hatchTexture()}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
        />
      </mesh>
    </group>
  );
}

function CameraFit({
  mesh,
  resetKey,
  controls,
}: {
  mesh: MeshData | null;
  resetKey: number;
  controls: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();
  const fitted = useRef<string>('');
  useEffect(() => {
    if (!mesh) return;
    const key = `${resetKey}`;
    if (fitted.current === key) return;
    fitted.current = key;
    const [x0, y0, z0] = mesh.bbox.min;
    const [x1, y1, z1] = mesh.bbox.max;
    const r = Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2;
    const dist =
      (r / Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360)) *
      (size.width < size.height ? 1.6 : 1.25);
    camera.position.set(dist * 0.65, dist * 0.55, dist * 0.75);
    camera.near = Math.max(0.5, dist / 100);
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [mesh, resetKey, camera, size, controls]);
  return null;
}

/** Reflections for the context objects (glass, metal) from a procedural studio room; no network needed. */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Scene(props: ViewerProps & { color: string }) {
  const {
    mesh,
    pieces,
    field,
    heat,
    ghost,
    showGhost,
    section,
    displayRotation,
    mirror,
    animation,
    handBreadth,
    color,
  } = props;
  const controls = useRef<OrbitControlsImpl>(null);
  const { partRef, ghostRefs } = useAnimatedPose(animation);
  // The hand opens for steps where it is not holding the part yet, and closes when it is.
  const handClosure = useMemo(
    () => ({
      target: animation ? (animation.spec.steps[animation.step]?.hand ?? 1) : 1,
      reduced: !!animation?.reduced,
    }),
    [animation],
  );
  const root = useRef<THREE.Group>(null);
  const { gl } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);

  // Clip plane in the part frame, converted to world space every frame.
  const localPlane = useMemo(() => {
    if (!section) return null;
    const n =
      section.axis === 'x'
        ? new THREE.Vector3(-1, 0, 0)
        : section.axis === 'y'
          ? new THREE.Vector3(0, -1, 0)
          : new THREE.Vector3(0, 0, -1);
    return new THREE.Plane(n, section.offset);
  }, [section]);
  const worldPlane = useMemo(() => new THREE.Plane(), []);
  const clip = useMemo(() => (localPlane ? [worldPlane] : []), [localPlane, worldPlane]);
  useFrame(() => {
    if (localPlane && partRef.current) {
      partRef.current.updateWorldMatrix(true, false);
      worldPlane.copy(localPlane).applyMatrix4(partRef.current.matrixWorld);
      // Keep the half whose cut face looks toward the default camera, so the section is visible.
      if (worldPlane.normal.dot(VIEW_DIR) > 0) worldPlane.negate();
    }
  });

  // Centre the part at the origin.
  const centre = useMemo<Vec3>(() => {
    if (!mesh) return [0, 0, 0];
    const b = mesh.bbox;
    return [-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -(b.min[2] + b.max[2]) / 2];
  }, [mesh]);
  const dr = displayRotation ?? [0, 0, 0];

  const shown = pieces.length ? pieces : mesh ? [mesh] : [];
  return (
    <>
      <StudioEnvironment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[200, 300, 250]} intensity={1.6} />
      <directionalLight position={[-250, -100, -200]} intensity={0.5} />
      <hemisphereLight args={['#ffffff', '#64748b', 0.4]} />
      <group ref={root} rotation={[-Math.PI / 2, 0, 0]} scale={[mirror ? -1 : 1, 1, 1]}>
        <group rotation={[deg(dr[0]), deg(dr[1]), deg(dr[2])]}>
          <group position={centre}>
            <group ref={partRef} matrixAutoUpdate={false}>
              {shown.map((m, i) => (
                <group key={m.name} position={pieces.length ? [0, 0, i * 6] : [0, 0, 0]}>
                  <Part mesh={m} field={field} heat={heat} clip={clip} color={i === 1 ? '#c9d1e0' : color} />
                </group>
              ))}
              {section?.data && (
                <SectionOverlay data={section.data} axis={section.axis} offset={section.offset} />
              )}
            </group>
            <GhostStudio.Provider value="viewer">
              <HandClosure.Provider value={handClosure}>
                {showGhost &&
                  ghost?.objects.map((o, i) => (
                    <group
                      key={i}
                      ref={(g) => {
                        ghostRefs.current[i] = g;
                      }}
                      matrixAutoUpdate={false}
                    >
                      <Ghost o={o} breadth={handBreadth} />
                    </group>
                  ))}
              </HandClosure.Provider>
            </GhostStudio.Provider>
          </group>
        </group>
      </group>
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.12} />
      <CameraFit mesh={mesh} resetKey={props.resetKey} controls={controls} />
      <CameraCommands cmd={props.camera} controls={controls} />
    </>
  );
}

export function Viewer(props: ViewerProps) {
  const [color, setColor] = useState('#33e0e0');
  const [bg, setBg] = useState('#0b0c14');
  const { partColor } = props;
  useEffect(() => {
    const update = () => {
      const hc = document.documentElement.dataset.contrast === 'high';
      setColor(partColor && !hc ? partColor : readCssVar('--color-part', '#33e0e0'));
      setBg(readCssVar('--color-viewer-bg', '#0b0c14'));
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-contrast'] });
    return () => mo.disconnect();
  }, [partColor]);
  return (
    <div className="relative h-full w-full" style={{ background: bg }}>
      <Canvas
        role="img"
        aria-label={props.label}
        camera={{ fov: 40, position: [200, 150, 200] }}
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Scene {...props} color={color} />
        </Suspense>
      </Canvas>
    </div>
  );
}
