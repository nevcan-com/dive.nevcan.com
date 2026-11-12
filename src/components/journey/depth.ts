/**
 * Single source of truth for the surface → 120 m environment.
 * Used at build time (section gradients), by the depth tracker and by the WebGL scene.
 *
 * NOTE: 120 m is a storytelling device based on Nevcan's deepest dive,
 * not a recommended dive profile or operational limit.
 */

export const MAX_DEPTH = 120;

export interface EnvParams {
  /** water / fog colour */
  water: string;
  /** ambient light from the surface, 0..1 */
  light: number;
  /** caustic pattern strength, 0..1 */
  caustics: number;
  /** god-ray strength, 0..1 */
  rays: number;
  /** suspended particle density, 0..1 */
  particles: number;
  /** diver torch intensity, 0..1 */
  torch: number;
}

interface Keyframe extends EnvParams {
  depth: number;
}

// the shallows are blue rather than green, matching the first clip (About, cuttlefish) so the
// surface hands over to it without a colour jump
// no torch on the way down: the dive light belongs to the torch outro alone (cinematics.ts)
export const keyframes: Keyframe[] = [
  { depth: 0, water: '#4f97c9', light: 1, caustics: 1, rays: 1, particles: 0.15, torch: 0 },
  { depth: 5, water: '#3a82b8', light: 0.85, caustics: 0.85, rays: 0.9, particles: 0.25, torch: 0 },
  {
    depth: 9,
    water: '#24618f',
    light: 0.74,
    caustics: 0.68,
    rays: 0.75,
    particles: 0.32,
    torch: 0,
  },
  { depth: 13, water: '#1a4f7c', light: 0.62, caustics: 0.5, rays: 0.6, particles: 0.4, torch: 0 },
  { depth: 30, water: '#0c5c88', light: 0.4, caustics: 0.12, rays: 0.3, particles: 0.55, torch: 0 },
  { depth: 50, water: '#06365a', light: 0.2, caustics: 0, rays: 0.08, particles: 0.7, torch: 0 },
  { depth: 80, water: '#031a30', light: 0.07, caustics: 0, rays: 0, particles: 0.8, torch: 0 },
  { depth: 100, water: '#010b16', light: 0.02, caustics: 0, rays: 0, particles: 0.9, torch: 0 },
  { depth: 120, water: '#000306', light: 0, caustics: 0, rays: 0, particles: 0.6, torch: 0 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: [number, number, number]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
export function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
}

/** Environment parameters at a given depth (metres). */
export function sample(depth: number): EnvParams {
  const d = Math.min(MAX_DEPTH, Math.max(0, depth));
  let i = 0;
  while (i < keyframes.length - 2 && d > keyframes[i + 1]!.depth) i++;
  const a = keyframes[i]!;
  const b = keyframes[i + 1]!;
  const t = clamp01((d - a.depth) / (b.depth - a.depth));
  return {
    water: mixHex(a.water, b.water, t),
    light: lerp(a.light, b.light, t),
    caustics: lerp(a.caustics, b.caustics, t),
    rays: lerp(a.rays, b.rays, t),
    particles: lerp(a.particles, b.particles, t),
    torch: lerp(a.torch, b.torch, t),
  };
}

/** CSS gradient for a depth band, used for the static (no-WebGL) background. */
export function bandGradient(from: number, to: number, steps = 4, alpha = 1) {
  const stops: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [r, g, bl] = hexToRgb(sample(lerp(from, to, t)).water);
    stops.push(`rgb(${r} ${g} ${bl} / ${alpha}) ${Math.round(t * 100)}%`);
  }
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}
