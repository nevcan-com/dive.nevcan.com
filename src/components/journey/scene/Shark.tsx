/**
 * Torch outro, from "The only light is the one you carry." on: a looping shark sequence, one
 * shark on screen at a time (the same model, so a loop costs no more than a single pass).
 *   1. a calm pass, right to left, below the line of text
 *   2. the attack: it rushes out of the dark straight at the torch, at the visitor, snaps its
 *      jaws right in front of the lens (the frame shakes) and veers off to the left
 *   3. a calm pass, left to right
 * then again from 1, for as long as the visitor stays. It starts when the visitor arrives at the
 * line (not on a jump straight to the footer) and restarts each time they arrive there again.
 *
 * Model: "Animated Swimming Great White Shark Loop" by LasquetiSpice (Sketchfab), CC BY 4.0,
 * the optimised copy used on dipnot.app (meshopt + WebP; swim and bite clips). The credit shows
 * in the frame corner while the shark is on (ClipCredit.astro). Loaded only near the outro.
 *
 * Lighting: only this component adds lights; the rest of the scene is unlit shader materials.
 * A warm spot follows the same aim as the screen-space torch beam (torchBeam() in glsl.ts), so
 * the shark is lit where the beam is drawn and stays a dark shape elsewhere.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AmbientLight,
  AnimationMixer,
  Box3,
  Group,
  MathUtils,
  type Material,
  Quaternion,
  type Object3D,
  SpotLight,
  Vector3,
  type AnimationAction,
  type PerspectiveCamera,
} from 'three';
import { env } from './env';
import { OUTRO_END, OUTRO_START, SHARK_FROM } from '../cinematics';

const SRC = '/models/shark.glb';
/** start loading this far above the outro */
const PRELOAD = 12;
const LENGTH = 8.5;
/** the line gets this long to itself before the shark comes */
const DELAY = 1.6;
/** calm passes: duration, and the model's scale (a smaller, more distant shark) */
const CRUISE = 14;
const CRUISE_SCALE = 0.55;
/** the attack: where it appears (deep in the fog) and how close its centre comes */
const FAR = 30;
const CLOSE = 5.1;
const ATTACK = 7.5;
/** jaws start working just before it arrives; one open-and-close */
/** the jaws: open wide on the rush, then snap at the lens again and again */
const GAPE_AT = 1.5;
const BITE_AT = 2.5;
const BITE_END = 4.5;
/** snaps per second while biting, and how much wider than the clip the jaw opens */
const SNAPS = 1.25;
const GAPE = 1.7;
/** the loop: calm right → left, attack, calm left → right (seconds after each one is a pause) */
type Act = { kind: 'cruise'; dir: 1 | -1 } | { kind: 'attack' };
const SEQUENCE: { act: Act; dur: number; pause: number }[] = [
  { act: { kind: 'cruise', dir: -1 }, dur: CRUISE, pause: 1.5 },
  { act: { kind: 'attack' }, dur: ATTACK, pause: 2 },
  { act: { kind: 'cruise', dir: 1 }, dur: CRUISE, pause: 2.5 },
];
const LOOP = SEQUENCE.reduce((sum, a) => sum + a.dur + a.pause, 0);

const smooth = (t: number) => t * t * (3 - 2 * t);

// GLTFLoader sanitises node names ("Head.5_5" → "Head5_5"): match base name + index digits
function bone(root: Object3D, base: string) {
  const re = new RegExp(`^${base}_?\\d`);
  let hit: Object3D | null = null;
  root.traverse((o) => {
    if (!hit && re.test(o.name)) hit = o;
  });
  if (!hit) throw new Error(`bone ${base} not found`);
  return hit as Object3D;
}

/** size the model, turn its tail→head axis to +Z (toward the camera), centre it */
function normalise(model: Object3D) {
  model.updateMatrixWorld(true);
  const size = new Box3().setFromObject(model, true).getSize(new Vector3());
  model.scale.setScalar(LENGTH / Math.max(size.x, size.y, size.z));
  model.updateMatrixWorld(true);
  const head = bone(model, 'Head').getWorldPosition(new Vector3());
  const tail = bone(model, 'Spine7').getWorldPosition(new Vector3());
  const dir = head.sub(tail).setY(0).normalize();
  model.rotation.y = -Math.atan2(dir.x, dir.z);
  model.updateMatrixWorld(true);
  model.position.sub(new Box3().setFromObject(model, true).getCenter(new Vector3()));
}

interface Loaded {
  mixer: AnimationMixer;
  swim: AnimationAction;
  bite: AnimationAction;
  materials: Material[];
  jaw: Object3D;
  jawRest: Quaternion;
  /** time in the bite clip where the jaw is open widest */
  openAt: number;
}

/** how far (radians) a bone is turned away from a rest orientation */
const turned = (q: Quaternion, rest: Quaternion) => rest.angleTo(q);

type Key = [t: number, p: { x: number; z: number }, v: { x: number; z: number }];

export function Shark() {
  const { scene, camera } = useThree();
  const rig = useMemo(() => new Group(), []);
  const lights = useMemo(() => {
    const g = new Group();
    const ambient = new AmbientLight(0x5a7f92, 0.18);
    const spot = new SpotLight(0xffe4b8, 0, 40, 0.34, 0.7, 1.1);
    g.add(ambient, spot, spot.target);
    return { g, ambient, spot };
  }, []);
  const loaded = useRef<Loaded | null>(null);
  const loading = useRef(false);
  /** t: sequence clock (negative while waiting); armed: may start at the line; act: current */
  const s = useRef({ t: -DELAY, armed: true, act: -1, heading: 0, bank: 0 });

  useEffect(() => {
    rig.visible = false;
    lights.g.visible = false;
    scene.add(rig, lights.g);
    return () => {
      scene.remove(rig, lights.g);
      loaded.current?.mixer.stopAllAction();
    };
  }, [scene, rig, lights]);

  const load = () => {
    loading.current = true;
    Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    ])
      .then(([{ GLTFLoader }, { MeshoptDecoder }]) =>
        new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(SRC),
      )
      .then((gltf) => {
        const model = gltf.scene;
        normalise(model);
        const materials: Material[] = [];
        model.traverse((o) => {
          const m = (o as { material?: Material | Material[] }).material;
          if (!m) return;
          (Array.isArray(m) ? m : [m]).forEach((mat) => {
            mat.transparent = true;
            materials.push(mat);
          });
        });
        rig.add(model);
        const mixer = new AnimationMixer(model);
        const clip = (name: string) =>
          gltf.animations.find((c) => c.name === name) ?? gltf.animations[0]!;
        const swim = mixer.clipAction(clip('Swimming'));
        const bite = mixer.clipAction(clip('Biting'));
        swim.play();
        bite.play();
        bite.paused = true; // its time is set per frame: one bite per pass
        bite.setEffectiveWeight(0);
        // find the widest-open moment of the bite clip by sampling the jaw bone
        const jaw = bone(model, 'Jaw');
        const jawRest = jaw.quaternion.clone();
        const dur = bite.getClip().duration;
        bite.setEffectiveWeight(1);
        swim.setEffectiveWeight(0);
        let openAt = dur * 0.4;
        let widest = -1;
        for (let k = 0; k <= 40; k++) {
          bite.time = (k / 40) * dur;
          mixer.update(0);
          const a = turned(jaw.quaternion, jawRest);
          if (a > widest) {
            widest = a;
            openAt = bite.time;
          }
        }
        bite.time = 0;
        bite.setEffectiveWeight(0);
        swim.setEffectiveWeight(1);
        loaded.current = { mixer, swim, bite, materials, jaw, jawRest, openAt };
      })
      .catch((err) => console.warn('[journey] shark unavailable', err));
  };

  const tmp = useMemo(() => new Vector3(), []);
  /** world point on the ray through a screen position (uv, 0..1 from bottom left) at a distance */
  const along = (out: Vector3, u: number, v: number, dist: number) => {
    out.set(u * 2 - 1, v * 2 - 1, 0.5).unproject(camera);
    return out.sub(camera.position).normalize().multiplyScalar(dist).add(camera.position);
  };

  useFrame((_, delta) => {
    if (!loaded.current) {
      if (!loading.current && env.depth > OUTRO_START - PRELOAD) load();
      return;
    }
    const st = s.current;
    const { mixer, swim, bite, materials } = loaded.current;
    const dt = Math.min(delta, 0.05);
    const on = env.depth >= SHARK_FROM;

    // re-arm once the visitor has left the line, so arriving again starts from the top
    if (!on) {
      st.armed = true;
      st.t = -DELAY;
      st.act = -1;
    }
    // it only starts at the line itself, not when the visitor jumps straight to the footer
    if (on && st.t < 0 && env.depth > OUTRO_END + 0.5) st.armed = false;
    const playing = on && st.armed;
    if (playing) st.t += dt;

    // which act is on, and its local time
    let act: Act | null = null;
    let t = 0;
    let dur = 1;
    let index = -1;
    if (playing && st.t >= 0) {
      let local = st.t % LOOP;
      for (const [i, a] of SEQUENCE.entries()) {
        if (local < a.dur) {
          act = a.act;
          t = local;
          dur = a.dur;
          index = i;
          break;
        }
        local -= a.dur + a.pause;
        if (local < 0) break;
      }
    }
    rig.visible = !!act;
    lights.g.visible = rig.visible;
    if (!act) {
      st.act = -1;
      return;
    }
    const fresh = index !== st.act;
    st.act = index;

    // the torch: same origin and aim as the beam drawn in the backdrop shader
    const p = env.pointer;
    along(lights.spot.position, 0.62, -0.25, 1.2);
    along(lights.spot.target.position, 0.5 + p.x * 0.32, 0.55 + p.y * 0.28, 9);

    const cam = camera as PerspectiveCamera;
    const hw = (d: number) => Math.tan(MathUtils.degToRad(cam.fov / 2)) * d * cam.aspect;
    const P = (xr: number, d: number) => ({ x: xr * hw(d), z: -d });

    let at: (time: number) => Vector3;
    let opacity: number;
    if (act.kind === 'cruise') {
      // far → nearest in the middle (through the beam) → far, below the line of text
      const dir = act.dir;
      at = (time) => {
        const k = MathUtils.clamp(time / CRUISE, 0, 1);
        const d = 17 - 6 * Math.sin(Math.PI * k);
        return tmp.set(
          (1.35 - 2.7 * k) * -dir * hw(d),
          -1.5 + Math.sin(Math.PI * k) * 0.25 + Math.sin(time * 0.4) * 0.1,
          -d,
        );
      };
      const k = t / dur;
      opacity = Math.min(1, k / 0.12, (1 - k) / 0.12);
      rig.scale.setScalar(CRUISE_SCALE);
    } else {
      // Keyframes with explicit velocities (cubic Hermite): position and speed are continuous
      // and every velocity points the way it is going, so the path can't loop back on itself.
      //   0–1.6 out of the fog, the rush · 1.6–2.9 straight at the lens, braking · 2.8–4.1 the
      //   bite, head-on and close · 4.1–7.5 veers off to the left and is gone
      const keys: Key[] = [
        [0, P(0.6, FAR), { x: -2, z: 9 }],
        [1.6, P(0.3, 15), { x: -1.2, z: 8 }], // the rush
        [2.9, { x: 0.25, z: -CLOSE }, { x: -0.3, z: 1.5 }], // arrives, filling the frame
        [4.1, { x: -0.2, z: -CLOSE + 0.4 }, { x: -1, z: 0.2 }], // the bite
        [5.4, { x: -3.2, z: -CLOSE - 0.3 }, { x: -3.5, z: -0.6 }], // veers left
        [ATTACK, P(-2.2, 10), { x: -3, z: -1 }], // gone off the left edge
      ];
      at = (time) => {
        const tt = MathUtils.clamp(time, 0, ATTACK);
        let i = 0;
        while (i < keys.length - 2 && tt > keys[i + 1]![0]) i++;
        const [t1, p1, v1] = keys[i]!;
        const [t2, p2, v2] = keys[i + 1]!;
        const h = t2 - t1;
        const u = (tt - t1) / h;
        const u2 = u * u;
        const u3 = u2 * u;
        const herm = (k: 'x' | 'z') =>
          (2 * u3 - 3 * u2 + 1) * p1[k] +
          (u3 - 2 * u2 + u) * v1[k] * h +
          (-2 * u3 + 3 * u2) * p2[k] +
          (u3 - u2) * v2[k] * h;
        const z = herm('z');
        // high in the beam while far; level with the lens when it arrives
        const y = 0.1 + 0.85 * MathUtils.clamp((-z - CLOSE) / (FAR - CLOSE), 0, 1);
        return tmp.set(herm('x'), y, z);
      };
      opacity = t < 1 ? smooth(t) : Math.min(1, (ATTACK - t) / 0.8);
      rig.scale.setScalar(1);
    }

    const here = at(t).clone();
    const ahead = at(Math.min(t + 0.25, dur));
    const dx = ahead.x - here.x;
    const dz = ahead.z - here.z;
    // heading follows the direction of travel with a little lag (0 = facing the camera); the
    // attack never wraps past facing left (that reads as a spin); the body banks into turns
    let want = dx * dx + dz * dz > 1e-4 ? Math.atan2(dx, dz) : st.heading;
    if (act.kind === 'attack') want = MathUtils.clamp(want, -1.9, 0.4);
    if (fresh) {
      st.heading = want;
      st.bank = 0;
    }
    const prev = st.heading;
    st.heading +=
      Math.atan2(Math.sin(want - st.heading), Math.cos(want - st.heading)) *
      Math.min(1, dt * (act.kind === 'attack' ? 4 : 2.5));
    const rate = (st.heading - prev) / Math.max(dt, 1e-3);
    st.bank += (MathUtils.clamp(-rate * 0.35, -0.5, 0.5) - st.bank) * Math.min(1, dt * 3);
    rig.position.copy(here);
    rig.rotation.set(Math.sin(t * 0.27) * 0.03, st.heading, st.bank, 'YXZ');
    for (const m of materials) m.opacity = opacity;

    // the torch: dims as it closes in so the near pass isn't blown out, but widens and swings
    // onto the shark, so it is lit properly right in front of the lens
    const dist = rig.position.length();
    const close = act.kind === 'attack' ? 1 - MathUtils.clamp((dist - 4.5) / 9, 0, 1) : 0;
    lights.spot.target.position.lerp(rig.position, close * 0.85);
    lights.spot.angle = MathUtils.lerp(0.34, 0.75, close);
    lights.spot.intensity =
      env.torch * MathUtils.lerp(70, 34, MathUtils.clamp((20 - dist) / 14, 0, 1));
    lights.ambient.intensity = 0.18 + close * 0.12;

    // jaws (attack only): open wide on the rush, then snap again and again in front of the lens
    const { jaw, jawRest, openAt } = loaded.current;
    const clipDur = bite.getClip().duration;
    let bw = 0;
    if (act.kind === 'attack' && t >= GAPE_AT && t < BITE_END) {
      bw = Math.min(1, (t - GAPE_AT) / 0.25, (BITE_END - t) / 0.3);
      if (t < BITE_AT) {
        bite.time = openAt * smooth((t - GAPE_AT) / (BITE_AT - GAPE_AT));
      } else {
        // each snap: from open, closed hard, open again (starting at the open moment)
        bite.time = (openAt + (t - BITE_AT) * SNAPS * clipDur) % clipDur;
      }
    } else {
      bite.time = 0;
    }
    bite.setEffectiveWeight(bw);
    swim.setEffectiveWeight(1 - bw * 0.7);
    const pace = act.kind === 'cruise' ? 0.7 : t < 2.9 ? 2 : 1.5;
    if (fresh) swim.timeScale = pace;
    swim.timeScale += (pace - swim.timeScale) * Math.min(1, dt * 1.5);
    mixer.update(dt);

    // the clip's jaw opens only a little: open it wider (scale its turn away from rest)
    if (bw > 0) {
      const delta = jawRest.clone().invert().multiply(jaw.quaternion);
      const angle = 2 * Math.acos(MathUtils.clamp(delta.w, -1, 1));
      if (angle > 1e-4) {
        const axis = new Vector3(delta.x, delta.y, delta.z).normalize();
        const wider = new Quaternion().setFromAxisAngle(axis, angle * (1 + (GAPE - 1) * bw));
        jaw.quaternion.copy(jawRest).multiply(wider);
      }
    }

    // the frame shakes while it bites at the lens, as if it hit the camera (runs after
    // DepthDriver's camera placement, so it is a small offset on top)
    if (act.kind === 'attack' && t > 2.6 && t < BITE_END) {
      const k = Math.min(1, (t - 2.6) / 0.15) * Math.min(1, (BITE_END - t) / 0.6) * close;
      camera.position.x += (Math.random() - 0.5) * 0.08 * k;
      camera.position.y += (Math.random() - 0.5) * 0.08 * k;
    }
  });

  return null;
}
