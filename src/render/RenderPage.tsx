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
import { GROUP_FILAMENT, RENDER_SIZE, SHOTS } from './config';
import { frameObject, StudioLights, StudioSubject } from '../viewer/Studio';
import { ArticulatedHand } from '../viewer/Hand';
import type { HandPose } from '../viewer/handModel';

declare global {
  interface Window {
    __renderReady?: boolean;
    __renderError?: string;
    __capture?: (type?: string, quality?: number) => string;
  }
}

function Studio({ id, mesh, params }: { id: FamilyId; mesh: MeshData; params: Params }) {
  const shot = SHOTS[id];
  const { gl, scene, camera } = useThree();

  // Frame the whole subject (part + context object) once everything is in the scene.
  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const fit = () => {
      if (++frames < 3) {
        raf = requestAnimationFrame(fit);
        return;
      }
      // render.html?id=B1&yaw=-20 turns the camera about the vertical axis (turn strips for the board).
      const yaw = (Number(new URLSearchParams(window.location.search).get('yaw') ?? 0) * Math.PI) / 180;
      const v = new THREE.Vector3(...(shot.view ?? [0.85, 0.62, 1])).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        yaw,
      );
      frameObject(camera as THREE.PerspectiveCamera, scene.getObjectByName('subject')!, [v.x, v.y, v.z]);
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
      <StudioLights />
      <StudioSubject id={id} mesh={mesh} params={params} hideGhosts={shot.hideGhosts} />
    </>
  );
}

/** Hand check: render.html?hand=grip&d=32 shows the articulated hand alone (with the handle for grips). */
function HandCheck({ pose, d }: { pose: HandPose; d: number }) {
  const { gl, scene, camera } = useThree();
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#e9e7e3', roughness: 0.5, clearcoat: 0.15 }),
    [],
  );
  const handle = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: GROUP_FILAMENT.A, roughness: 0.55 }),
    [],
  );
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    gl.toneMapping = THREE.NeutralToneMapping;
    const cam = camera as THREE.PerspectiveCamera;
    const v = (new URLSearchParams(window.location.search).get('view') ?? '260,180,320')
      .split(',')
      .map(Number);
    cam.position.set(v[0], v[1], v[2]);
    cam.lookAt(0, 0, 0);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.__capture = (type = 'image/png', quality = 0.9) => gl.domElement.toDataURL(type, quality);
        window.__renderReady = true;
      }),
    );
  }, [gl, scene, camera]);
  return (
    <>
      <directionalLight position={[260, 520, 380]} intensity={3} />
      <directionalLight position={[-420, 260, -360]} intensity={2} color="#bfe6ff" />
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <ArticulatedHand pose={pose} gripD={d} mat={mat} />
        {(pose === 'grip' || pose === 'hook') && (
          <mesh rotation={[Math.PI / 2, 0, 0]} material={handle}>
            <cylinderGeometry args={[d / 2, d / 2, 140, 40]} />
          </mesh>
        )}
      </group>
    </>
  );
}

export function RenderPage() {
  const q = new URLSearchParams(window.location.search);
  const handPose = q.get('hand') as HandPose | null;
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
    const params = family.repair({
      ...family.defaults,
      ...(preset?.params ?? {}),
      ...(shot.params ?? {}),
    } as Params);
    loadKernel(() => wasmUrl)
      .then((K) => setState({ mesh: runBuild(K, id, params).mesh, params }))
      .catch((e) => (window.__renderError = String(e)));
  }, [id]);

  if (handPose) {
    return (
      <Canvas
        dpr={1}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 35 }}
        style={{ width: size, height: size }}
      >
        <HandCheck pose={handPose} d={Number(q.get('d') ?? 32)} />
      </Canvas>
    );
  }
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
