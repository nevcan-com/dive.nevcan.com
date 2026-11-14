/**
 * Two jellyfish that appear briefly in the dark, on the first line of the torch outro
 * ("Down here, daylight is gone."), and are gone before the torch comes on and the shark arrives.
 *
 * A rigged, animated model (public/models/jellyfish.glb; source and status in CREDITS.md), loaded
 * once; the second jellyfish is a clone with its own skeleton, animation clock and swim.
 *
 * Motion: they swim the way jellyfish do. Each contraction of the bell pushes it up, then water
 * drag slows it and it coasts, sinking a touch between beats. The push is measured from the
 * model's own animation (how fast the bell's radius shrinks), so the rise follows the pulse.
 * Their pulses are offset, so they never beat together.
 *
 * Look: soft neon bioluminescence. The scene has no lights in the dark, so they show by their own
 * glow: a light blue leads, with violet inside and a lilac-pink heart; a light blue rim light
 * turning violet toward the edge, brightening slightly on each beat; a soft halo behind each.
 * Everything blends additively (light added to the dark).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  AnimationMixer,
  Box3,
  Color,
  Group,
  type Material,
  type MeshStandardMaterial,
  Mesh,
  type Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import { env } from './env';
import { OUTRO_START, SPAN } from '../cinematics';

const SRC = '/models/jellyfish.glb';
/** start loading this far (m) above the outro */
const PRELOAD = 12;
/** model height (bell top to tentacle tips) in scene units, before the spec's scale */
const HEIGHT = 4.2;

export interface JellySpec {
  x: number;
  y: number;
  z: number;
  scale: number;
  /** seconds into the swim cycle it starts at (keeps the two out of step) */
  offset: number;
}

// on the first line of the torch outro (it holds at 0.36 of the outro, autoplay.ts): they fade
// in with the line and out before the torch comes on and the shark arrives with the second line
const T = (p: number) => OUTRO_START + SPAN.torch * p;
const WINDOW = [T(0.18), T(0.3), T(0.56), T(0.68)] as const;
/** the band they wrap around in (beyond the frame edges) */
const RANGE = 9;

/** swimming: mean rise (units/s), water drag (1/s), and the sink between beats (units/s²) */
const RISE = 0.26;
const DRAG = 1.6;
const SINK = 0.06;

/** one either side of the line: left a little larger and nearer, right smaller and further
    (phones have no torch outro, so no jellyfish: DepthScene.tsx) */
const SWARM: JellySpec[] = [
  { x: -5.2, y: -1.4, z: -11, scale: 0.78, offset: 0 },
  { x: 5.6, y: -4.2, z: -13, scale: 0.62, offset: 1.9 },
];

/** neon palette for the deep: a light blue leads, violet supports it, a hint of lilac-pink at the
    edges (pale enough to glow, but not white: at 100 m it should read blue) */
const AQUA = new Color('#74c6ff');
const LILAC = new Color('#9a7cff');
const PINK = new Color('#d79cff');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

interface Glow {
  mat: MeshStandardMaterial;
  /** emissive strength at full glow */
  peak: number;
  rim?: { strength: { value: number }; beat: { value: number } };
}

/** stand it up at a fixed height, centred */
function normalise(model: Object3D) {
  model.updateMatrixWorld(true);
  const size = new Box3().setFromObject(model, true).getSize(new Vector3());
  model.scale.setScalar(HEIGHT / size.y);
  model.updateMatrixWorld(true);
  model.position.sub(new Box3().setFromObject(model, true).getCenter(new Vector3()));
}

/** a fresnel rim light on a standard material: pale aqua, lilac then pink right at the edge */
function addRim(mat: MeshStandardMaterial) {
  const strength = { value: 0 };
  const beat = { value: 0 };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimStrength = strength;
    shader.uniforms.uBeat = beat;
    shader.uniforms.uAqua = { value: AQUA };
    shader.uniforms.uLilac = { value: LILAC };
    shader.uniforms.uPink = { value: PINK };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uRimStrength, uBeat;\nuniform vec3 uAqua, uLilac, uPink;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float fr = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.2);
        vec3 rimCol = mix(uAqua, uLilac, smoothstep(0.45, 0.9, fr) * 0.65);
        rimCol = mix(rimCol, uPink, smoothstep(0.85, 1.0, fr) * 0.35);
        totalEmissiveRadiance += rimCol * fr * uRimStrength * (1.0 + 0.6 * uBeat);`,
      );
  };
  mat.customProgramCacheKey = () => 'jelly-rim';
  return { strength, beat };
}

/** recolour a model's materials as pale neon light; each jellyfish gets its own copies */
function glowUp(model: Object3D): Glow[] {
  const glows: Glow[] = [];
  model.traverse((o) => {
    const mesh = o as { material?: Material | Material[] };
    if (!mesh.material) return;
    const own = (mat: Material) => {
      const std = mat.clone() as MeshStandardMaterial;
      if (!std.emissive) return std;
      const heart = std.name === 'JF_heart';
      const inner = std.name === 'JF_skin_in';
      std.emissive.copy(heart ? PINK : inner ? LILAC : AQUA);
      // a dark body: the colour comes from the emissive glow, not from (absent) light
      std.color.set('#0a0f1e');
      std.transparent = true;
      std.depthWrite = false;
      std.blending = AdditiveBlending;
      std.alphaTest = 0;
      std.fog = false;
      std.emissiveIntensity = 0;
      glows.push({
        mat: std,
        peak: heart ? 0.12 : inner ? 0.18 : 0.85,
        rim: heart ? undefined : addRim(std),
      });
      return std;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
  });
  return glows;
}

const haloVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const haloFrag = /* glsl */ `
  uniform float uGlow, uBeat;
  uniform vec3 uAqua, uLilac;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    vec3 c = mix(mix(uAqua, uLilac, 0.35), uAqua, smoothstep(0.0, 0.5, r));
    float a = pow(1.0 - smoothstep(0.0, 1.0, r), 2.0);
    gl_FragColor = vec4(c * a * uGlow * (0.14 + 0.08 * uBeat), 1.0);
  }
`;

function makeHalo() {
  const mat = new ShaderMaterial({
    vertexShader: haloVert,
    fragmentShader: haloFrag,
    uniforms: {
      uGlow: { value: 0 },
      uBeat: { value: 0 },
      uAqua: { value: AQUA },
      uLilac: { value: LILAC },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const m = new Mesh(new PlaneGeometry(5, 5), mat);
  // behind the bell
  m.position.set(0, HEIGHT * 0.28, -0.6);
  m.renderOrder = -1;
  return m;
}

interface Swimmer {
  spec: JellySpec;
  rig: Group;
  halo: Mesh;
  mixer: AnimationMixer;
  glows: Glow[];
  t: number;
  y: number;
  vy: number;
}

export function Jellyfish() {
  const swarm = SWARM;
  const { scene, camera } = useThree();
  const root = useMemo(() => new Group(), []);
  const state = useRef<{
    swimmers: Swimmer[];
    duration: number;
    /** push per unit of clip time (0..1), sampled */
    thrust: number[];
    gain: number;
  } | null>(null);
  const loading = useRef(false);

  useEffect(() => {
    root.visible = false;
    scene.add(root);
    return () => {
      scene.remove(root);
      state.current?.swimmers.forEach((s) => s.mixer.stopAllAction());
    };
  }, [scene, root]);

  const load = () => {
    loading.current = true;
    Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      import('three/examples/jsm/utils/SkeletonUtils.js'),
    ])
      .then(([{ GLTFLoader }, { MeshoptDecoder }, SkeletonUtils]) =>
        new GLTFLoader()
          .setMeshoptDecoder(MeshoptDecoder)
          .loadAsync(SRC)
          .then((gltf) => ({ gltf, clone: SkeletonUtils.clone })),
      )
      .then(({ gltf, clone }) => {
        const clip = gltf.animations[0]!;
        normalise(gltf.scene);

        // the bell's pulse: its radius over the clip, from the bell (Top.*) bones
        const probe = new AnimationMixer(gltf.scene);
        probe.clipAction(clip).play();
        const bones: Object3D[] = [];
        gltf.scene.traverse((o) => {
          if (o.name.startsWith('Top')) bones.push(o);
        });
        const N = 64;
        const radius: number[] = [];
        const p = new Vector3();
        for (let k = 0; k < N; k++) {
          probe.setTime((k / N) * clip.duration);
          gltf.scene.updateMatrixWorld(true);
          let sum = 0;
          for (const b of bones) {
            b.getWorldPosition(p);
            gltf.scene.worldToLocal(p);
            sum += Math.hypot(p.x, p.z);
          }
          radius.push(sum / Math.max(1, bones.length));
        }
        probe.stopAllAction();
        // push = how fast the bell closes (radius shrinking), 0 while it relaxes
        const raw = radius.map((r, k) => Math.max(0, r - radius[(k + 1) % N]!));
        const top = Math.max(...raw, 1e-6);
        const thrust = raw.map((v) => v / top);
        const mean = thrust.reduce((a, b) => a + b, 0) / N;
        // scale the push so that, with drag and sink, it rises at RISE on average
        const gain = (RISE * DRAG + SINK) / Math.max(mean, 1e-3);

        const swimmers = swarm.map((spec, i) => {
          const model = i === 0 ? gltf.scene : clone(gltf.scene);
          const glows = glowUp(model);
          const rig = new Group();
          const halo = makeHalo();
          rig.scale.setScalar(spec.scale);
          rig.add(halo, model);
          root.add(rig);
          const mixer = new AnimationMixer(model);
          mixer.clipAction(clip).play();
          mixer.setTime(spec.offset % clip.duration);
          return { spec, rig, halo, mixer, glows, t: spec.offset, y: spec.y, vy: RISE };
        });
        state.current = { swimmers, duration: clip.duration, thrust, gain };
      })
      .catch((err) => console.warn('[journey] jellyfish unavailable', err));
  };

  useFrame((_, delta) => {
    const st = state.current;
    if (!st) {
      if (!loading.current && env.depth > OUTRO_START - PRELOAD) load();
      return;
    }
    const fade =
      smoothstep(WINDOW[0], WINDOW[1], env.depth) *
      (1 - smoothstep(WINDOW[2], WINDOW[3], env.depth));
    root.visible = fade > 0.001;
    if (!root.visible) return;

    const dt = Math.min(delta, 0.05);
    // soft neon: clear in the dark, gentler while some daylight remains
    const glow = fade * (0.45 + 0.75 * (1 - env.light));
    const { duration, thrust, gain } = st;

    for (const s of st.swimmers) {
      s.t += dt;
      s.mixer.update(dt);

      // where in the pulse it is, and how hard the bell is pushing right now
      const phase = ((s.t % duration) / duration) * thrust.length;
      const k0 = Math.floor(phase) % thrust.length;
      const k1 = (k0 + 1) % thrust.length;
      const beat = thrust[k0]! + (thrust[k1]! - thrust[k0]!) * (phase - Math.floor(phase));

      // swim: push on contraction, drag slows it, a slight sink between beats
      s.vy += (gain * beat - DRAG * s.vy - SINK) * dt;
      s.y += s.vy * dt;
      if (s.y > RANGE) s.y -= 2 * RANGE;

      for (const g of s.glows) {
        g.mat.emissiveIntensity = g.peak * glow * (1 + 0.2 * beat);
        g.mat.opacity = fade;
        if (g.rim) {
          g.rim.strength.value = 0.45 * glow;
          g.rim.beat.value = beat;
        }
      }
      const hu = (s.halo.material as ShaderMaterial).uniforms;
      hu.uGlow!.value = glow;
      hu.uBeat!.value = beat;
      s.halo.quaternion.copy(camera.quaternion);

      // a slow drift and a gentle lean, as the current carries it
      const { spec } = s;
      s.rig.position.set(spec.x + Math.sin(s.t * 0.07 + spec.offset) * 0.25, s.y, spec.z);
      s.rig.rotation.z = Math.sin(s.t * 0.13 + spec.offset) * 0.08;
      s.rig.rotation.x = Math.cos(s.t * 0.11 + spec.offset) * 0.06;
    }
  });

  return null;
}
