/**
 * Per-frame environment state shared by all scene components.
 * Updated once per frame by <DepthDriver/>, read by everyone else (no React re-renders).
 */
import { Color } from 'three';
import { sample, type EnvParams } from '../depth';
import { cinematics, type Segment } from '../cinematics';

export interface SceneEnv extends Omit<EnvParams, 'water'> {
  depth: number;
  water: Color;
  breach: number;
  dark: number;
  segment: Segment;
  /** 0..1, how much chapter footage covers the frame right now (written by the backdrop) */
  footage: number;
  /** pointer position, -1..1, smoothed */
  pointer: { x: number; y: number };
}

const initial = cinematics(0);

export const env: SceneEnv = {
  depth: 0,
  water: new Color(sample(0).water),
  light: 1,
  caustics: 1,
  rays: 1,
  particles: 0.15,
  torch: 0,
  breach: 0,
  dark: 0,
  segment: initial.segment,
  footage: 0,
  pointer: { x: 0, y: 0 },
};

export function applyDepth(depth: number) {
  const p = sample(depth);
  const c = cinematics(depth);
  env.depth = depth;
  env.water.set(p.water);
  env.light = p.light;
  env.caustics = p.caustics;
  env.rays = p.rays;
  env.particles = p.particles;
  env.torch = c.torch;
  env.breach = c.breach;
  env.dark = c.dark;
  env.segment = c.segment;
}
