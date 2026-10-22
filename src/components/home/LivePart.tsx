/**
 * The home page's live part: A1 built by the real geometry worker, turning slowly, with its grip size
 * stepping through three values so the part and the hand around it visibly change. Code-split: it pulls
 * in three.js, so the home page loads first and this arrives after.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { Box3, Vector3 } from 'three';
import { geometry } from '../../geometry/client';
import type { BuildResult } from '../../geometry/protocol';
import { getFamily } from '../../families';
import type { Params } from '../../families/types';
import { StudioLights, StudioSubject } from '../../viewer/Studio';
import { prefersReducedMotion } from '../../state/settings';

export const LIVE_ID = 'A1' as const;
export const LIVE_STEPS = [32, 42, 26];
const STEP_MS = 3600;

export interface LiveState {
  grip: number;
  ms: number;
}

function Turntable({ build, params, still }: { build: BuildResult; params: Params; still: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const framed = useRef(false);
  // Centre on the first build so later sizes grow in place.
  const [centre] = useState<[number, number, number]>(() => {
    const b = build.mesh.bbox;
    return [-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -(b.min[2] + b.max[2]) / 2];
  });
  const { camera, scene, invalidate } = useThree();
  useEffect(() => {
    if (framed.current) return;
    const raf = requestAnimationFrame(() => {
      const subject = scene.getObjectByName('live-subject');
      if (!subject) return;
      // Frame once around the turning axis, with room for the largest grip, so nothing swings out of
      // view and the part grows inside a fixed frame.
      const box = new Box3().setFromObject(subject);
      const reach = Math.max(...[box.min.x, box.max.x, box.min.z, box.max.z].map(Math.abs));
      const half = (box.max.y - box.min.y) / 2;
      const target = new Vector3(0, (box.min.y + box.max.y) / 2, 0);
      const cam = camera as THREE.PerspectiveCamera;
      const dist = (Math.hypot(reach, half) / Math.sin((cam.fov * Math.PI) / 360)) * 1.0;
      cam.position.copy(target).addScaledVector(new Vector3(0.85, 0.45, 1).normalize(), dist);
      cam.near = dist / 50;
      cam.far = dist * 10;
      cam.lookAt(target);
      cam.updateProjectionMatrix();
      framed.current = true;
      invalidate();
    });
    return () => cancelAnimationFrame(raf);
  }, [build, camera, scene, invalidate]);
  useFrame((_, dt) => {
    if (!still && spin.current) spin.current.rotation.y += dt * 0.35;
  });
  return (
    <group ref={spin} rotation={[0, -0.5, 0]}>
      <StudioSubject id={LIVE_ID} mesh={build.mesh} params={params} centreOn={centre} name="live-subject" />
    </group>
  );
}

export default function LivePart({
  onState,
  onReady,
}: {
  onState: (s: LiveState) => void;
  onReady: () => void;
}) {
  const [current, setCurrent] = useState<{ build: BuildResult; params: Params } | null>(null);
  const [visible, setVisible] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const still = prefersReducedMotion();

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      setVisible(e.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const family = getFamily(LIVE_ID)!;
    const preset = family.presets.find((p) => p.id === 'spoon');
    let step = 0;
    let timer = 0;
    let cancelled = false;
    const run = async () => {
      const grip = LIVE_STEPS[step % LIVE_STEPS.length];
      const params = family.repair({ ...family.defaults, ...(preset?.params ?? {}), gripOD: grip } as Params);
      try {
        const build = await geometry.build({ type: 'build', familyId: LIVE_ID, params });
        if (cancelled) return;
        setCurrent({ build, params });
        onState({ grip, ms: build.ms });
        if (step === 0) onReady();
      } catch {
        return; // The still render stays in place.
      }
      step++;
      if (!still) timer = window.setTimeout(tick, STEP_MS);
    };
    // Off screen or in a background tab: wait, then carry on.
    const tick = () => {
      if (cancelled) return;
      if (document.hidden || !visibleRef.current) timer = window.setTimeout(tick, 1000);
      else run();
    };
    run();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  return (
    <div ref={box} className="absolute inset-0">
      {current && (
        <Canvas
          dpr={[1, 2]}
          frameloop={visible && !still ? 'always' : 'demand'}
          gl={{ alpha: true, antialias: true }}
          camera={{ fov: 30 }}
          shadows
          aria-hidden="true"
        >
          <StudioLights />
          <Turntable build={current.build} params={current.params} still={still} />
        </Canvas>
      )}
    </div>
  );
}
