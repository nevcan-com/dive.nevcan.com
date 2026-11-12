/**
 * Procedural jellyfish that appear briefly in the dark, in the torch outro before Contact (no model files).
 * - organic bell (lathe profile with an in-curling skirt) plus a dimmer inner bell for depth
 * - mottled tissue, radial canals, frilled margin
 * - eight ctenophore-style comb rows carrying travelling, beating rainbow light ("electric" colours)
 * - asymmetric swim pulse (fast contraction, slow relaxation); tentacles follow with a delay
 * They glow brighter as daylight fades and drift past as the visitor descends.
 */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  type Group,
  LatheGeometry,
  type Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
} from 'three';
import { env } from './env';
import { OUTRO_START, SPAN } from '../cinematics';
import { noise } from './glsl';

const shared = /* glsl */ `
  // swim pulse: quick contraction, slow relaxation (0 = relaxed, 1 = fully contracted)
  float swim(float t, float phase) {
    float p = fract(t * 0.42 + phase);
    return smoothstep(0.0, 0.16, p) * (1.0 - smoothstep(0.16, 1.0, p));
  }
  vec3 rainbow(float t) { return 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + t)); }
  vec3 tissue(float t) { return vec3(0.8, 0.82, 0.95) + 0.16 * cos(6.2831 * (vec3(0.0, 0.15, 0.3) + t)); }
`;

const bellVert = /* glsl */ `
  uniform float uTime, uPhase;
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vLocal;
  ${shared}
  void main() {
    vec3 p = position;
    float c = swim(uTime, uPhase);
    float ang = atan(p.z, p.x);
    float skirt = smoothstep(0.45, -0.05, p.y);
    // contraction narrows the margin most, and lifts the dome
    p.xz *= 1.0 - c * (0.08 + 0.16 * skirt);
    p.y += c * 0.07 * (1.0 - skirt);
    // frilled margin
    p.xz *= 1.0 + skirt * 0.035 * sin(ang * 22.0 + uTime * 2.0);
    vLocal = p;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const bellFrag = /* glsl */ `
  precision highp float;
  uniform float uTime, uHue, uGlow, uInner;
  varying vec3 vN;
  varying vec3 vView;
  varying vec3 vLocal;
  ${noise}
  ${shared}
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vView)));
    float rim = pow(f, 1.8);
    float ang = atan(vLocal.z, vLocal.x);
    float y = vLocal.y;

    float mottle = fbm(vec2(ang * 3.0, y * 9.0) + vec2(uHue * 10.0, 0.0));
    float canals = pow(abs(cos(ang * 4.0)), 34.0) * smoothstep(0.05, 0.3, y);
    float margin = smoothstep(0.08, -0.06, y);

    // comb rows: eight meridians between the canals, with beating cilia sending light along them
    float row = pow(abs(cos(ang * 4.0 + 0.3927)), 70.0) * smoothstep(0.02, 0.22, y) * smoothstep(1.0, 0.72, y);
    float beat = smoothstep(0.35, 1.0, sin(y * 70.0 - uTime * 18.0 + ang * 2.0));
    vec3 electric = rainbow(uHue + y * 1.8 - uTime * 1.4 + ang * 0.25);

    vec3 col = tissue(uHue + rim * 0.4) * (rim * 0.75 + mottle * 0.12 + canals * 0.28 + margin * 0.55);
    col += electric * row * (0.45 + 1.6 * beat) * 1.5;
    col += vec3(1.0) * pow(f, 5.0) * 0.45;
    float a = rim * 0.5 + mottle * 0.05 + canals * 0.12 + margin * 0.3 + row * (0.5 + 0.5 * beat) + 0.02;
    gl_FragColor = vec4(col * uGlow * uInner, clamp(a, 0.0, 1.0) * uGlow * uInner);
  }
`;

const strandVert = /* glsl */ `
  attribute float aT;
  attribute float aAngle;
  attribute float aLen;
  attribute float aSeed;
  attribute float aRadius;
  uniform float uTime, uPhase, uPixelRatio, uBead;
  varying float vT;
  varying float vSeed;
  ${shared}
  void main() {
    // strands respond a beat after the bell
    float c = swim(uTime - aT * 0.35, uPhase);
    float r = aRadius * (1.0 - c * 0.2);
    vec3 base = vec3(cos(aAngle) * r, -0.04, sin(aAngle) * r);
    float s = aT * aLen;
    vec3 p = base - vec3(0.0, s * (1.0 - c * 0.12), 0.0);
    float w = uTime * 1.1 + aSeed * 6.2831 - s * 1.6;
    p.x += sin(w) * 0.2 * aT + sin(w * 0.37 + aAngle) * 0.42 * aT * aT;
    p.z += cos(w * 0.8 + aSeed) * 0.2 * aT;
    p.xz *= 1.0 - aT * 0.35;
    vT = aT;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uBead * (1.0 - aT * 0.65) * uPixelRatio * (9.0 / max(-mv.z, 0.5));
  }
`;

const strandFrag = /* glsl */ `
  precision highp float;
  uniform float uTime, uHue, uGlow, uBead, uElectric;
  varying float vT;
  varying float vSeed;
  ${shared}
  void main() {
    float soft = 1.0;
    if (uBead > 0.0) {
      vec2 c = gl_PointCoord - 0.5;
      soft = smoothstep(0.25, 0.0, dot(c, c));
    }
    vec3 base = mix(vec3(1.0), tissue(uHue + vT * 0.3), 0.6);
    // light pulses run down the strands in shifting colours
    float pulse = smoothstep(0.6, 1.0, sin(vT * 26.0 - uTime * 11.0 + vSeed * 12.0));
    vec3 col = base + rainbow(uHue + vT * 1.4 - uTime * 1.1 + vSeed) * pulse * uElectric * 1.4;
    float a = pow(1.0 - vT, 1.3) * (0.55 + pulse * uElectric * 0.6) * uGlow * soft;
    gl_FragColor = vec4(col * uGlow, a * 0.85);
  }
`;

const haloVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const haloFrag = /* glsl */ `
  precision highp float;
  uniform float uHue, uGlow, uTime;
  varying vec2 vUv;
  ${shared}
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, d);
    vec3 c = mix(tissue(uHue), rainbow(uHue - uTime * 0.05), 0.35);
    gl_FragColor = vec4(c * a * a * 0.2 * uGlow, a * 0.18 * uGlow);
  }
`;

/** bell profile (radius, height): flat-ish dome, flared shoulder, skirt curling inward */
const BELL = [
  [0.0, 1.0],
  [0.3, 0.98],
  [0.56, 0.9],
  [0.76, 0.74],
  [0.9, 0.54],
  [0.98, 0.32],
  [1.0, 0.14],
  [0.96, 0.02],
  [0.88, -0.06],
].map(([r, y]) => new Vector2(r, y));

function strands(
  count: number,
  segments: number,
  radius: number,
  len: [number, number],
  seed0: number,
) {
  const n = count * segments;
  const t = new Float32Array(n);
  const angle = new Float32Array(n);
  const length = new Float32Array(n);
  const seed = new Float32Array(n);
  const rad = new Float32Array(n);
  const index: number[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + seed0;
    const l = len[0] + Math.random() * (len[1] - len[0]);
    const s = Math.random();
    for (let j = 0; j < segments; j++) {
      const k = i * segments + j;
      t[k] = j / (segments - 1);
      angle[k] = a;
      length[k] = l;
      seed[k] = s;
      rad[k] = radius;
      if (j < segments - 1) index.push(k, k + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aT', new BufferAttribute(t, 1));
  g.setAttribute('aAngle', new BufferAttribute(angle, 1));
  g.setAttribute('aLen', new BufferAttribute(length, 1));
  g.setAttribute('aSeed', new BufferAttribute(seed, 1));
  g.setAttribute('aRadius', new BufferAttribute(rad, 1));
  g.setIndex(index);
  return g;
}

export interface JellySpec {
  /** depth (m) at which it crosses the middle of the frame */
  anchor: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  hue: number;
}

// They belong to the dark, on the first line of the torch outro: a few small ones drift around
// "Down here, daylight is gone." (which holds at 0.36 of the outro, autoplay.ts) and are gone
// before the torch comes on and the sharks arrive with the second line (Shark.tsx).
const T = (p: number) => OUTRO_START + SPAN.torch * p;
const WINDOW = [T(0.18), T(0.3), T(0.56), T(0.68)] as const;
/** height gained per swim stroke, and the band they wrap around in (beyond the frame edges) */
const STROKE = 0.42;
const RANGE = 9;

export const SWARM: JellySpec[] = [
  // one, larger, left of the line, rising through the dark
  { anchor: 0, x: -5.4, y: -1.8, z: -11, scale: 1.15, hue: 0.62 },
];
/** phones: the frame is narrow (at z -11 it is only about ±2.4 wide), so the jellyfish rises
    right of centre, a little smaller, instead of far left where it is out of frame */
const SWARM_COMPACT: JellySpec[] = [
  { anchor: 0, x: 0.55, y: -2.2, z: -11, scale: 0.85, hue: 0.62 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function Jelly({ spec, index, compact }: { spec: JellySpec; index: number; compact: boolean }) {
  const group = useRef<Group>(null);
  const halo = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const phase = index * 0.37;

  const parts = useMemo(() => {
    // fresh uniform objects per material (sharing them would advance time several times per frame)
    const u = (extra: Record<string, { value: number }> = {}) => ({
      uTime: { value: 0 },
      uPhase: { value: phase },
      uHue: { value: spec.hue },
      uGlow: { value: 0 },
      ...extra,
    });
    const blend = { transparent: true, depthWrite: false, blending: AdditiveBlending };
    // phones get a lighter build: fewer bell facets and points per strand (it is smaller there)
    const k = compact ? 0.6 : 1;
    const bellGeo = new LatheGeometry(BELL, compact ? 40 : 72);
    return {
      bellGeo,
      tentGeo: strands(12, Math.round(40 * k), 0.9, [2.4, 4.2], index),
      beadGeo: strands(5, Math.round(48 * k), 0.88, [2.0, 3.4], index + 0.31),
      armGeo: strands(3, Math.round(64 * k), 0.16, [1.4, 2.4], index + 0.7),
      haloGeo: new PlaneGeometry(5.5, 5.5),
      bell: new ShaderMaterial({
        vertexShader: bellVert,
        fragmentShader: bellFrag,
        uniforms: u({ uInner: { value: 1 } }),
        side: DoubleSide,
        ...blend,
      }),
      inner: new ShaderMaterial({
        vertexShader: bellVert,
        fragmentShader: bellFrag,
        uniforms: u({ uInner: { value: 0.45 } }),
        side: BackSide,
        ...blend,
      }),
      tent: new ShaderMaterial({
        vertexShader: strandVert,
        fragmentShader: strandFrag,
        uniforms: u({ uPixelRatio: { value: 1 }, uBead: { value: 0 }, uElectric: { value: 0.6 } }),
        ...blend,
      }),
      bead: new ShaderMaterial({
        vertexShader: strandVert,
        fragmentShader: strandFrag,
        uniforms: u({ uPixelRatio: { value: 1 }, uBead: { value: 2.2 }, uElectric: { value: 1 } }),
        ...blend,
      }),
      arm: new ShaderMaterial({
        vertexShader: strandVert,
        fragmentShader: strandFrag,
        uniforms: u({
          uPixelRatio: { value: 1 },
          uBead: { value: 3.4 },
          uElectric: { value: 0.4 },
        }),
        ...blend,
      }),
      halo: new ShaderMaterial({
        vertexShader: haloVert,
        fragmentShader: haloFrag,
        uniforms: u(),
        ...blend,
      }),
    };
  }, [index, phase, spec.hue, compact]);

  const mats = [parts.bell, parts.inner, parts.tent, parts.bead, parts.arm, parts.halo];

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const fade =
      smoothstep(WINDOW[0], WINDOW[1], env.depth) *
      (1 - smoothstep(WINDOW[2], WINDOW[3], env.depth));
    g.visible = fade > 0.001;
    if (!g.visible) return;
    // bioluminescence: vivid in the dark; distant jellies read softer (aerial perspective)
    const distance = Math.min(1, Math.max(0, (-spec.z - 8) / 12));
    const glow = fade * (0.4 + 0.8 * (1 - env.light)) * (1 - distance * 0.45);
    for (const m of mats) {
      m.uniforms.uTime!.value += delta;
      m.uniforms.uGlow!.value = glow;
      if (m.uniforms.uPixelRatio) m.uniforms.uPixelRatio.value = gl.getPixelRatio();
    }
    const t = parts.bell.uniforms.uTime!.value as number;
    // they swim up: each contraction pushes them a stroke higher (fast, then coasting), and
    // they wrap round out of frame, so a few always cross the dark
    const cycle = t * 0.42 + phase;
    const p = cycle % 1;
    const stroke = Math.floor(cycle) + (1 - (1 - Math.min(1, p / 0.45)) ** 3);
    const climb = ((spec.y + stroke * STROKE + RANGE) % (2 * RANGE)) - RANGE;
    g.position.set(
      spec.x + Math.sin(t * 0.11 + index) * 0.5,
      climb,
      spec.z,
    );
    g.rotation.z = Math.sin(t * 0.19 + index) * 0.14;
    g.rotation.x = Math.cos(t * 0.15 + index) * 0.12;
    halo.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={group} scale={spec.scale} visible={false}>
      <mesh ref={halo} geometry={parts.haloGeo} material={parts.halo} position={[0, -0.2, -0.3]} />
      <mesh
        geometry={parts.bellGeo}
        material={parts.inner}
        scale={[0.82, 0.86, 0.82]}
        position={[0, -0.04, 0]}
      />
      <mesh geometry={parts.bellGeo} material={parts.bell} />
      <lineSegments geometry={parts.tentGeo} material={parts.tent} />
      <points geometry={parts.beadGeo} material={parts.bead} />
      <points geometry={parts.armGeo} material={parts.arm} />
    </group>
  );
}

export function Jellyfish({ compact }: { compact: boolean }) {
  const swarm = compact ? SWARM_COMPACT : SWARM;
  return (
    <>
      {swarm.map((spec, i) => (
        <Jelly key={i} spec={spec} index={i} compact={compact} />
      ))}
    </>
  );
}
