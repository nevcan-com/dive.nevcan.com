import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, DataTexture, ShaderMaterial, type Texture } from 'three';
import { journey, type ClipBlend } from '@/data/journey';
import { env } from './env';
import { OUTRO_START, type Segment } from '../cinematics';
import { noise, torch } from './glsl';
import { clip, hasFrames, setPlaying, type Clip } from './media';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uAspect, uLight, uRays, uCaustics, uTorch, uDepth, uBreach, uDark;
  uniform vec3 uWater;
  uniform vec2 uPointer;
  uniform sampler2D uVidA, uVidB;
  uniform float uGainA, uGainB, uBlendA, uBlendB, uAspectA, uAspectB, uWA, uWB, uSlideB, uSurface;
  uniform float uNatA, uNatB;
  ${noise}
  ${torch}

  // cover-fit a clip into the frame, with slight overscan for pointer parallax
  vec2 coverUv(vec2 uv, float va) {
    vec2 s = uAspect > va ? vec2(1.0, va / uAspect) : vec2(uAspect / va, 1.0);
    return (uv - 0.5) * s * 0.95 + 0.5 + uPointer * 0.01;
  }

  // depth grade: desaturate a touch, pull toward the water colour, lose light with depth.
  // k scales the tint and the darkening (1 = full grade); saturation is always 80%
  vec3 grade(vec3 v, float k) {
    float l = dot(v, vec3(0.299, 0.587, 0.114));
    v = mix(vec3(l), v, 0.8);
    v = mix(v, uWater * 1.25, (0.14 + (uDepth / 120.0) * 0.45) * k);
    v *= mix(1.0, 0.62 + 0.5 * uLight, k);
    v = (v - 0.5) * 1.1 + 0.5;
    return max(v, 0.0) * mix(1.0, 0.86, k);
  }

  // 'natural' chapters (nat = NATURAL in JS) get half the tint and darkening of the others
  vec3 look(vec3 v, float nat) {
    return grade(v, 1.0 - nat);
  }

  vec3 layer(vec3 col, vec3 v, float gain, float blend, float beam, float nat) {
    if (gain <= 0.001) return col;
    if (blend < 0.5) return mix(col, look(v, nat), gain);   // normal
    if (blend < 1.5) return col + look(v, nat) * gain * 0.45; // screen (bubbles)
    return col; // torch-lit footage is added after the lights go out (see below)
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;

    // waterline for the over-under surface shot (y, bottom = 0)
    float wl = mix(0.2, 1.3, uBreach);
    float wob = sin(uv.x * uAspect * 7.0 + t * 1.1) * 0.006
              + (vnoise(vec2(uv.x * uAspect * 14.0, t * 0.6)) - 0.5) * 0.01;
    float below = wl - uv.y;
    vec2 ruv = uv;
    if (uSurface > 0.5 && uSurface < 1.5 && uBreach < 0.999) ruv.x += sin(uv.y * 80.0 + t * 2.0) * 0.003 * smoothstep(0.2, 0.0, below);

    // ---- underwater ----
    vec3 col = uWater;
    float topGlow = smoothstep(0.1, 1.2, ruv.y);
    col += mix(uWater, vec3(1.0), 0.55) * topGlow * topGlow * 0.32 * uLight;

    if (uCaustics > 0.001) {
      vec2 q = vec2(ruv.x * uAspect, ruv.y) * vec2(3.0, 9.0) + vec2(0.0, t * 0.08);
      float n = fbm(q + fbm(q * 0.7 + t * 0.12) * 1.6);
      float ripple = pow(smoothstep(0.42, 0.78, n), 2.0);
      float band = smoothstep(0.72, 1.0, ruv.y);
      col += vec3(1.0, 1.0, 0.96) * ripple * band * uCaustics * 0.4;
      col += vec3(1.0) * band * band * uCaustics * 0.14;
    }

    float beam = uTorch > 0.001 ? torchBeam(uv, uAspect, uPointer) : 0.0;

    // (weights come from JS, see clipWeights())
    float wA = uWA;
    float wB = uWB;
    vec3 va = texture2D(uVidA, coverUv(ruv, uAspectA)).rgb;
    // the first clip rises into place as it fades in, carrying on the surface photo's pan
    vec2 uvB = (ruv - 0.5) / (1.0 + uSlideB * 0.08) + 0.5 + vec2(0.0, uSlideB * 0.06);
    vec3 vb = texture2D(uVidB, coverUv(uvB, uAspectB)).rgb;
    col = layer(col, va, uGainA * wA, uBlendA, beam, uNatA);
    col = layer(col, vb, uGainB * wB, uBlendB, beam, uNatB);
    float natural = max(uGainA * wA * uNatA, uGainB * wB * uNatB);
    float cover = max(uGainA * wA * step(uBlendA, 0.5), uGainB * wB * step(uBlendB, 0.5));

    if (uRays > 0.001) {
      vec2 src = vec2(0.5 + uPointer.x * 0.04 + sin(t * 0.05) * 0.05, 1.45);
      vec2 d = vec2((uv.x - src.x) * uAspect, uv.y - src.y);
      float ang = atan(d.x, -d.y);
      float r = length(d);
      float shafts = vnoise(vec2(ang * 22.0, t * 0.12)) * vnoise(vec2(ang * 9.0 - t * 0.05, 3.0));
      shafts = smoothstep(0.18, 0.75, shafts);
      float fade = smoothstep(2.0, 0.45, r) * smoothstep(0.35, 0.6, r);
      // gentle: about half the old strength, and fainter still over footage
      col += vec3(0.85, 0.97, 1.0) * shafts * fade * uRays * 0.22 * (1.0 - 0.6 * cover);
    }

    vec2 c = uv - 0.5;
    // the depth vignette closes in as light fades; natural footage keeps only a soft frame
    col *= clamp(1.0 - dot(c, c) * mix(0.6 + 1.2 * (1.0 - uLight), 0.35, natural), 0.0, 1.0);

    // lights out, then the torch
    col *= 1.0 - uDark * 0.96;
    // torch-lit footage: only what the beam touches is revealed ('torchlit' clips always,
    // regular clips once the lights have gone out)
    float reveal = clamp(beam * 1.7, 0.0, 1.0);
    reveal *= reveal * (3.0 - 2.0 * reveal) * clamp(uTorch * 1.5, 0.0, 1.0);
    col += va * reveal * uGainA * wA * 1.35 * (uBlendA > 1.5 ? 1.0 : uDark);
    col += vb * reveal * uGainB * wB * 1.35 * (uBlendB > 1.5 ? 1.0 : uDark);
    if (uTorch > 0.001) {
      float grain = 0.93 + 0.07 * vnoise(uv * vec2(uAspect, 1.0) * 9.0 + vec2(0.0, t * 0.15));
      col += vec3(1.0, 0.91, 0.72) * beam * uTorch * 0.33 * grain;
    }

    // ---- above water (only while the waterline is in frame) ----
    // uSurface 1: the drawn surface (sky above a rising waterline); 2: sky only, behind the
    // hero's over-under photo, which brings its own sea (the sky stays put and gives way to
    // the water as the photo fades)
    if (uSurface > 0.5 && uBreach < 0.999) {
      // behind the photo the sky drifts up a little as the descent starts (parallax)
      float skyWl = uSurface > 1.5 ? 0.2 + uBreach * 0.35 : wl;
      // a fair-weather sky: deep blue overhead, hazy toward the horizon, the sun high on the
      // right and slow-drifting cumulus (fbm), lit on the sun side and greyer underneath
      // height above the waterline on a fixed scale, so the whole sky (sun and clouds) rises
      // rigidly with the waterline instead of being squeezed into the shrinking strip
      float sh = clamp((uv.y - skyWl) / 0.8, 0.0, 1.0);
      vec3 sky = mix(vec3(0.84, 0.92, 0.95), vec3(0.20, 0.50, 0.82), pow(sh, 0.65));
      vec2 sunAt = vec2(0.74 * uAspect, skyWl + 0.56);
      vec2 sp = vec2(uv.x * uAspect, uv.y) - sunAt;
      float sd2 = dot(sp, sp);
      sky += vec3(1.0, 0.95, 0.82) * (exp(-sd2 * 7.0) * 0.28 + exp(-sd2 * 40.0) * 0.22);
      // clouds: flattened toward the horizon (perspective), drifting left to right; domain
      // warping gives billowy cumulus shapes, the sun side is lit and the bases are greyer
      float persp = 1.0 / (sh + 0.22);
      vec2 cp = vec2(uv.x * uAspect * mix(1.6, 0.9, sh), persp * 1.3) + vec2(t * 0.015, 0.0);
      cp += 0.45 * vec2(fbm(cp * 0.7 + 3.1), fbm(cp * 0.7 + 8.3));
      float c = fbm(cp * 1.2) + 0.35 * fbm(cp * 4.0 + 2.0);
      float cover = smoothstep(0.6, 0.78, c) * smoothstep(0.03, 0.22, sh) * (1.0 - smoothstep(0.75, 1.0, sh));
      float body = smoothstep(0.6, 0.95, c);
      float toSun = clamp(dot(normalize(-sp + 1e-4), vec2(0.0, -1.0)) * 0.5 + 0.5, 0.0, 1.0);
      vec3 cloud = mix(vec3(0.66, 0.72, 0.80), vec3(1.0, 0.99, 0.97), clamp(0.35 + body * 0.5 + toSun * 0.25, 0.0, 1.0));
      cloud += vec3(1.0, 0.94, 0.82) * exp(-sd2 * 10.0) * 0.3;
      sky = mix(sky, cloud, cover * 0.95);
      // the sun: a small bright disc with a warm bloom, dimmed where cloud passes over it
      sky += vec3(1.0, 0.97, 0.88) * (smoothstep(0.0006, 0.0003, sd2) * 1.2 + exp(-sd2 * 220.0) * 0.5)
             * (1.0 - cover * 0.75);
      vec3 above = sky;
      float mask = uSurface > 1.5
        ? 1.0 - smoothstep(0.5, 1.0, uBreach)
        : smoothstep(wl + wob - 0.0025, wl + wob + 0.0025, uv.y);
      col = mix(col, above, mask);
      if (uSurface < 1.5) col += vec3(1.0) * exp(-abs(uv.y - wl - wob) * 160.0) * 0.55;
    }

    // filmic-ish roll-off: highlights compress instead of clipping to neon
    col = mix(col, 1.0 - exp(-col * 1.35), 0.8);

    // film grain + dither
    col += (hash(uv * vec2(1920.0, 1080.0) + fract(t * 7.0) * 100.0) - 0.5) * 0.035;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** how far 'natural' chapters ease off the depth grade (tint, darkening, vignette): 0..1 */
const NATURAL = 0.5;

const BLEND: Record<ClipBlend, number> = { normal: 0, screen: 1, torchlit: 2 };

const ss = (e0: number, e1: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
};

/**
 * Footage is sequential, never layered: clip A leaves during the first half of a transition,
 * open water holds for a breath, then clip B arrives in the second half. Out of the surface
 * (breach) the first clip uses the whole span, as long as the surface took to leave.
 */
function clipWeights(seg: Segment) {
  if (seg.kind === 'breach') return { wA: 1, wB: ss(0, 1, seg.t) };
  return { wA: 1 - ss(0, 0.42, seg.t), wB: ss(0.58, 1, seg.t) };
}

function blank() {
  const t = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}

/** next chapter with footage below the current depth, so its clip is buffered in time */
function lookahead(depth: number) {
  return journey.find((c) => c.clip && c.depthStart > depth && c.depthStart - depth < 25);
}

export function Backdrop() {
  const size = useThree((s) => s.size);
  const empty = useMemo(blank, []);
  const heroPhoto = useMemo(() => !!document.querySelector('.hero-photo'), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uLight: { value: 1 },
          uRays: { value: 1 },
          uCaustics: { value: 1 },
          uTorch: { value: 0 },
          uDepth: { value: 0 },
          uBreach: { value: 0 },
          uDark: { value: 0 },
          uWater: { value: new Color() },
          uPointer: { value: [0, 0] },
          uVidA: { value: empty },
          uVidB: { value: empty },
          uGainA: { value: 0 },
          uGainB: { value: 0 },
          uBlendA: { value: 0 },
          uBlendB: { value: 0 },
          uAspectA: { value: 16 / 9 },
          uAspectB: { value: 16 / 9 },
          uWA: { value: 1 },
          uWB: { value: 0 },
          uSlideB: { value: 0 },
          uSurface: { value: 1 },
          uNatA: { value: 0 },
          uNatB: { value: 0 },
        },
      }),
    [empty],
  );

  useFrame((_, delta) => {
    const u = material.uniforms;
    u.uTime!.value += delta;
    u.uAspect!.value = size.width / size.height;
    u.uLight!.value = env.light;
    u.uRays!.value = env.rays;
    u.uCaustics!.value = env.caustics;
    u.uTorch!.value = env.torch;
    u.uDepth!.value = env.depth;
    u.uBreach!.value = env.breach;
    // under the hero's over-under photo (homepage) only the sky is drawn: it shows through the
    // photo's transparent sky, and no drawn sea rises behind the photo
    u.uSurface!.value = heroPhoto ? 2 : 1;
    u.uDark!.value = env.dark;
    // env.water is in three's linear working space; this raw shader outputs sRGB directly
    (u.uWater!.value as Color).copy(env.water).convertLinearToSRGB();
    u.uPointer!.value = [env.pointer.x, env.pointer.y];

    const seg = env.segment;
    // once the outro's lights are out the chapter's footage leaves: its own photograph takes
    // over if it has one, otherwise only the dark and the torch remain (an unseen swap)
    const fromClip = seg.from.outro && env.dark > 0.9 ? seg.from.outroClip : seg.from.clip;
    const a: Clip | null = fromClip ? clip(fromClip) : null;
    if (seg.from.outroClip && env.depth > OUTRO_START - 10) clip(seg.from.outroClip); // preload
    const b: Clip | null = seg.to?.clip ? clip(seg.to.clip) : null;
    const ahead = lookahead(env.depth);
    if (ahead?.clip) clip(ahead.clip); // creating the element starts buffering

    const k = 1 - Math.exp(-delta * 3);
    for (const c of [a, b]) if (c) c.presence += ((hasFrames(c) ? 1 : 0) - c.presence) * k;
    setPlaying(new Set([a?.name, b?.name].filter((n): n is string => !!n)));

    const tex = (c: Clip | null): Texture => (c && hasFrames(c) ? c.texture : empty);
    u.uVidA!.value = tex(a);
    u.uVidB!.value = tex(b);
    u.uGainA!.value = a ? a.presence : 0;
    u.uGainB!.value = b && seg.to ? b.presence : 0;
    u.uBlendA!.value = BLEND[seg.from.blend ?? 'normal'];
    u.uNatA!.value = seg.from.natural ? NATURAL : 0;
    u.uNatB!.value = seg.to?.natural ? NATURAL : 0;
    u.uBlendB!.value = seg.to ? BLEND[seg.to.blend ?? 'normal'] : 0;
    u.uAspectA!.value = a?.aspect ?? 16 / 9;
    u.uAspectB!.value = b?.aspect ?? 16 / 9;
    const { wA, wB } = clipWeights(seg);
    u.uWA!.value = wA;
    u.uWB!.value = wB;
    u.uSlideB!.value = seg.kind === 'breach' ? 1 - wB : 0;
    // other layers (particles) stay off the footage
    env.footage = Math.max((u.uGainA!.value as number) * wA, (u.uGainB!.value as number) * wB);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
