/**
 * Studio look shared by the tile renders (render.html) and the live part on the home page:
 * image-based light from a procedural room, neutral tone mapping, a key light with soft shadows and a
 * cool rim light so edges read against the black ground.
 */
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { MeshData } from '../geometry/kernel';
import { getFamily } from '../families';
import type { FamilyId, Params } from '../families/types';
import { toGeometry } from './meshGeometry';
import { Ghost, GhostStudio } from './Ghosts';

export const GROUP_FILAMENT: Record<'A' | 'B' | 'C', string> = {
  A: '#0fa3b6', // cyan PETG
  B: '#b8268f', // magenta PETG
  C: '#e09a12', // amber PETG
};

const deg = (d: number) => (d * Math.PI) / 180;

export function StudioLights({ shadows = true }: { shadows?: boolean }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    // Neutral tone mapping keeps filament colours saturated (ACES washes them out).
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 0.9;
    gl.shadowMap.enabled = shadows;
    gl.shadowMap.type = THREE.PCFShadowMap;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, shadows]);
  return (
    <>
      <directionalLight
        position={[260, 520, 380]}
        intensity={3.2}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
        shadow-camera-far={2000}
      />
      <directionalLight position={[-420, 260, -360]} intensity={2} color="#bfe6ff" />
    </>
  );
}

/**
 * The part in its group's filament colour with its context objects, in three.js world space (Y up),
 * centred on the part's bounding box. `centreOn` pins the centre so a part that changes size grows in place.
 */
export function StudioSubject({
  id,
  mesh,
  params,
  hideGhosts,
  centreOn,
  name = 'subject',
}: {
  id: FamilyId;
  mesh: MeshData;
  params: Params;
  hideGhosts?: string[];
  centreOn?: [number, number, number];
  name?: string;
}) {
  const family = getFamily(id)!;
  const geom = useMemo(() => toGeometry(mesh), [mesh]);
  useEffect(() => () => geom.dispose(), [geom]);
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: GROUP_FILAMENT[family.group],
        roughness: 0.55,
        envMapIntensity: 0.45,
      }),
    [family.group],
  );
  const ghosts = family.ghost(params).objects.filter((o) => !hideGhosts?.includes(o.kind));
  const dr = family.displayRotation ?? [0, 0, 0];
  const b = mesh.bbox;
  const centre = centreOn ?? [
    -(b.min[0] + b.max[0]) / 2,
    -(b.min[1] + b.max[1]) / 2,
    -(b.min[2] + b.max[2]) / 2,
  ];
  return (
    <group name={name} rotation={[-Math.PI / 2, 0, 0]}>
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
  );
}

/** Points a perspective camera at an object from a direction so its bounding sphere fills the frame. */
export function frameObject(
  cam: THREE.PerspectiveCamera,
  obj: THREE.Object3D,
  view: [number, number, number],
  margin = 1,
) {
  const box = new THREE.Box3().setFromObject(obj);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const dir = new THREE.Vector3(...view).normalize();
  const dist = (sphere.radius / Math.sin(deg(cam.fov / 2))) * margin;
  cam.position.copy(sphere.center).addScaledVector(dir, dist);
  cam.near = dist / 50;
  cam.far = dist * 10;
  cam.lookAt(sphere.center);
  cam.updateProjectionMatrix();
  return sphere;
}
