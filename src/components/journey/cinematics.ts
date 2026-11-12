/**
 * Everything cinematic is a pure function of depth, so the WebGL scene, the CSS fallback and the
 * depth rail can never drift apart. `tracker.ts` publishes these values as CSS variables;
 * the scene reads them every frame (from its damped depth).
 */
import { journey, type JourneySection, type TransitionKind } from '@/data/journey';
import { sample } from './depth';

/** Depth (m) consumed by each kind of transition, right before the chapter it leads into. */
// breach: from the moment the waterline has passed (BREACH_END = 8) to About (12 m), so the
// first clip arrives over the same distance the surface took to leave (4 m out, 4 m in)
export const SPAN: Record<TransitionKind, number> = { breach: 4, card: 3, torch: 6 };

/** Depth at which the waterline has fully passed above the camera. */
export const BREACH_END = 8;

export interface Segment {
  from: JourneySection;
  to: JourneySection | null;
  kind: TransitionKind | null;
  /** 0..1 progress through the transition (0 when not transitioning) */
  t: number;
}

export interface Cinematics {
  breach: number;
  dark: number;
  torch: number;
  segment: Segment;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function interludeStart(c: JourneySection) {
  return c.transition ? c.depthStart - SPAN[c.transition] : c.depthStart;
}

/** The chapter whose outro is the torch transition (lights out, then the torch), and its span. */
export const outroChapter = journey.find((c) => c.outro === 'torch');
export const OUTRO_START = outroChapter?.depthEnd ?? Infinity;
export const OUTRO_END = OUTRO_START + SPAN.torch;
/** from "The only light is the one you carry." on, a shark cruises through the torch beam
    (scene/Shark.tsx; its CC BY credit shows in the corner, see ClipCredit.astro) */
export const SHARK_FROM = OUTRO_START + SPAN.torch * 0.74;

export function segmentAt(depth: number): Segment {
  for (let i = 1; i < journey.length; i++) {
    const c = journey[i]!;
    const prev = journey[i - 1]!;
    const start = interludeStart(c);
    if (depth < start) return { from: prev, to: null, kind: null, t: 0 };
    if (depth < c.depthStart) {
      return {
        from: prev,
        to: c,
        kind: c.transition ?? null,
        t: (depth - start) / (c.depthStart - start),
      };
    }
  }
  return { from: journey.at(-1)!, to: null, kind: null, t: 0 };
}

/** Torch flicker: off, stutter, on. Scrubbed by scroll, so it plays forwards and backwards. */
function flicker(p: number) {
  if (p < 0.5) return 0;
  if (p >= 0.66) return 1;
  const steps = [0, 0.75, 0, 0.2, 0.95, 0.35, 1];
  return steps[Math.min(steps.length - 1, Math.floor(((p - 0.5) / 0.16) * steps.length))]!;
}

export function cinematics(depth: number): Cinematics {
  const segment = segmentAt(depth);
  // the outro keeps the last chapter's footage (it is torch-lit in the dark) and runs to Contact
  const torchProgress = clamp01((depth - OUTRO_START) / SPAN.torch);
  const dark = smoothstep(0, 0.35, torchProgress);
  const torchOn = flicker(torchProgress);
  const env = sample(depth);
  return {
    breach: clamp01(depth / BREACH_END),
    dark,
    torch: Math.max(env.torch * (1 - dark), torchOn),
    segment,
  };
}
