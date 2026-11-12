import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { FogExp2 } from 'three';
import { applyDepth, env } from './env';
import { Backdrop } from './Backdrop';
import { Particles } from './Particles';
import { Shark } from './Shark';
import { Jellyfish } from './Jellyfish';
import { disposeClips, setCompact } from './media';

interface Props {
  onReady: () => void;
  onLost: () => void;
}

/** Smooths the scroll depth into `env` and drives camera parallax + fog. Must be the first child. */
function DepthDriver({ onReady }: { onReady: () => void }) {
  const ready = useRef(false);
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.fog = new FogExp2(env.water.getHex(), 0.04);
  }, [scene]);

  useFrame((_, delta) => {
    const target = window.__diveDepth ?? 0;
    // frame-rate independent damping; tighter while a transition plays on its own clock
    const k = 1 - Math.exp(-delta * (window.__diveAutoplay ? 12 : 4));
    applyDepth(env.depth + (target - env.depth) * k);
    // the hero copy is cut at the drawn waterline (waterline.ts)
    window.__sceneBreach = env.breach;

    // pointer is smoothed once in tracker.ts and shared with the CSS torch mask
    const p = window.__divePointer;
    if (p) {
      env.pointer.x = p.x;
      env.pointer.y = p.y;
    }
    camera.position.x = env.pointer.x * 0.35;
    camera.position.y = env.pointer.y * 0.2;
    // look up toward the surface at first, level out as we descend
    const lookUp = Math.max(0, 1 - env.depth / 14) * 3.2;
    camera.lookAt(0, lookUp, -10);

    const fog = scene.fog as FogExp2 | null;
    if (fog) {
      fog.color.copy(env.water);
      fog.density = 0.018 + (env.depth / 120) * 0.03;
    }

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
  }, -1);

  return null;
}

export default function DepthScene({ onReady, onLost }: Props) {
  const compact = window.matchMedia('(max-width: 760px)').matches;
  setCompact(compact);
  useEffect(() => disposeClips, []);

  return (
    <Canvas
      dpr={compact ? [1, 1.25] : [1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 0] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', onLost);
      }}
      aria-hidden
    >
      <DepthDriver onReady={onReady} />
      <Backdrop />
      <Particles count={compact ? 700 : 1800} />
      <Shark />
      <Jellyfish compact={compact} />
    </Canvas>
  );
}
