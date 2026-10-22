/**
 * Dev-only studio render of one design (render.html?id=B1). Builds the part with the app's own geometry
 * engine, lights it like a product shot on a transparent background, and exposes window.__capture()
 * for scripts/render-parts.mjs. Not part of the production bundle.
 */
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import wasmUrl from 'manifold-3d/manifold.wasm?url';
import { loadKernel, type MeshData } from '../geometry/kernel';
import { runBuild } from '../geometry/jobs';
import { getFamily } from '../families';
import type { FamilyId, Params } from '../families/types';
import { toGeometry } from '../viewer/meshGeometry';
import { Ghost, GhostStudio } from '../viewer/Ghosts';
import { GROUP_FILAMENT, RENDER_SIZE, SHOTS } from './config';

declare global {
  interface Window {
    __renderReady?: boolean;
    __renderError?: string;
    __capture?: (type?: string, quality?: number) => string;
  }
}

const deg = (d: number) => (d * Math.PI) / 180;

function Studio({ id, mesh, params }: { id: FamilyId; mesh: MeshData; params: Params }) {
  const family = getFamily(id)!;
  const shot = SHOTS[id];
  const { gl, scene, camera } = useThree();
  const geom = useMemo(() => toGeometry(mesh), [mesh]);
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: GROUP_FILAMENT[family.group], roughness: 0.55, envMapIntensity: 0.45 }),
    [family.group],
  );
  const ghosts = family.ghost(params).objects.filter((o) => o.kind !== 'hand' && !shot.hideGhosts?.includes(o.kind));
  const dr = family.displayRotation ?? [0, 0, 0];
  const b = mesh.bbox;
  const centre: [number, number, number] = [-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -(b.min[2] + b.max[2]) / 2];

  // Image-based lighting from a procedural studio room (no network needed).
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    // Neutral tone mapping keeps filament colours saturated (ACES washes them out).
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 0.9;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  // Frame the whole subject (part + context object) once everything is in the scene.
  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const fit = () => {
      if (++frames < 3) {
        raf = requestAnimationFrame(fit);
        return;
      }
      const box = new THREE.Box3().setFromObject(scene.getObjectByName('subject')!);
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const cam = camera as THREE.PerspectiveCamera;
      const dir = new THREE.Vector3(...(shot.view ?? [0.85, 0.62, 1])).normalize();
      const dist = (sphere.radius / Math.sin(deg(cam.fov / 2))) * 1.0;
      cam.position.copy(sphere.center).addScaledVector(dir, dist);
      cam.near = dist / 50;
      cam.far = dist * 10;
      cam.lookAt(sphere.center);
      cam.updateProjectionMatrix();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          window.__capture = (type = 'image/webp', quality = 0.9) => gl.domElement.toDataURL(type, quality);
          window.__renderReady = true;
        }),
      );
    };
    raf = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(raf);
  }, [scene, camera, gl, shot.view]);

  return (
    <>
      <directionalLight
        position={[260, 520, 380]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
        shadow-camera-far={2000}
      />
      {/* Cool rim light so edges read against the black tiles. */}
      <directionalLight position={[-420, 260, -360]} intensity={2} color="#bfe6ff" />
      <group name="subject" rotation={[-Math.PI / 2, 0, 0]}>
        <group rotation={[deg(dr[0]), deg(dr[1]), deg(dr[2])]}>
          <group position={centre}>
            <mesh geometry={geom} material={material} castShadow receiveShadow />
            <GhostStudio.Provider value={true}>
              {ghosts.map((o, i) => (
                <Ghost key={i} o={o} breadth={85} />
              ))}
            </GhostStudio.Provider>
          </group>
        </group>
      </group>
    </>
  );
}

export function RenderPage() {
  const q = new URLSearchParams(window.location.search);
  const id = (q.get('id') ?? 'B1').toUpperCase() as FamilyId;
  const size = Number(q.get('size') ?? RENDER_SIZE);
  const [state, setState] = useState<{ mesh: MeshData; params: Params } | null>(null);

  useEffect(() => {
    const family = getFamily(id);
    if (!family) {
      window.__renderError = `Unknown family ${id}`;
      return;
    }
    const shot = SHOTS[id];
    const preset = family.presets.find((p) => p.id === shot.preset);
    const params = family.repair({ ...family.defaults, ...(preset?.params ?? {}), ...(shot.params ?? {}) } as Params);
    loadKernel(() => wasmUrl)
      .then((K) => setState({ mesh: runBuild(K, id, params).mesh, params }))
      .catch((e) => (window.__renderError = String(e)));
  }, [id]);

  if (!state) return null;
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        dpr={1}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 30 }}
        style={{ width: size, height: size, background: 'transparent' }}
      >
        <Studio id={id} mesh={state.mesh} params={state.params} />
      </Canvas>
    </div>
  );
}
