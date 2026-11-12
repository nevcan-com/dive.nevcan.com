import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three';
import { env } from './env';
import { torch } from './glsl';

const BOX = { x: 24, y: 16, z: 18 };
/** world units the particle field scrolls per metre of depth (sells the descent) */
const RISE_PER_METRE = 0.55;

const vertexShader = /* glsl */ `
  attribute float aSeed;
  uniform float uTime, uRise, uPixelRatio, uAspect, uTorch;
  uniform vec2 uPointer;
  uniform vec3 uBox;
  varying float vAlpha;
  varying float vLit;
  varying float vScreenY;
  ${torch}

  void main() {
    vec3 p = position;
    p.y = mod(p.y + uRise + uTime * (0.04 + aSeed * 0.05), uBox.y) - uBox.y * 0.5;
    p.x += sin(uTime * 0.2 + aSeed * 40.0) * 0.25;
    p.z += cos(uTime * 0.17 + aSeed * 23.0) * 0.25;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    float size = 1.0 + aSeed * 2.6;
    gl_PointSize = size * uPixelRatio * (14.0 / max(dist, 0.5));

    vec2 screen = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
    vScreenY = screen.y;
    float beam = uTorch > 0.001 ? torchBeam(screen, uAspect, uPointer) : 0.0;
    vLit = beam * uTorch * smoothstep(14.0, 2.0, dist);
    vAlpha = smoothstep(18.0, 4.0, dist) * smoothstep(0.3, 1.5, dist);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uDensity, uLight, uDark, uWaterline, uFootage;
  varying float vAlpha;
  varying float vLit;
  varying float vScreenY;
  void main() {
    if (vScreenY > uWaterline) discard; // nothing floats above the surface
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float soft = smoothstep(0.25, 0.0, d);
    vec3 ambient = vec3(0.75, 0.9, 1.0) * (0.12 + 0.5 * uLight) * (1.0 - uDark);
    vec3 lit = vec3(1.0, 0.92, 0.75) * vLit * 2.4;
    // nothing drifts over chapter footage: the particles only live in open water
    float a = soft * vAlpha * (uDensity * 0.55 * (1.0 - uDark) + vLit * 1.5) * (1.0 - uFootage);
    gl_FragColor = vec4(ambient + lit, a);
  }
`;

export function Particles({ count }: { count: number }) {
  const { gl, size } = useThree();

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX.x;
      pos[i * 3 + 1] = Math.random() * BOX.y;
      pos[i * 3 + 2] = -Math.random() * BOX.z + 2;
      seed[i] = Math.random();
    }
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uRise: { value: 0 },
          uPixelRatio: { value: 1 },
          uAspect: { value: 1 },
          uTorch: { value: 0 },
          uDensity: { value: 0 },
          uLight: { value: 1 },
          uDark: { value: 0 },
          uWaterline: { value: 0.3 },
          uFootage: { value: 0 },
          uPointer: { value: [0, 0] },
          uBox: { value: [BOX.x, BOX.y, BOX.z] },
        },
      }),
    [],
  );

  const heroPhoto = useMemo(() => !!document.querySelector('.hero-photo'), []);

  useFrame((_, delta) => {
    const u = material.uniforms;
    u.uTime!.value += delta;
    u.uRise!.value = env.depth * RISE_PER_METRE;
    u.uPixelRatio!.value = gl.getPixelRatio();
    u.uAspect!.value = size.width / size.height;
    u.uTorch!.value = env.torch;
    u.uDensity!.value = env.particles;
    u.uLight!.value = env.light;
    u.uDark!.value = env.dark;
    u.uFootage!.value = env.footage;
    // same waterline as the backdrop (`wl` in Backdrop.tsx): nothing floats in the sky. Behind
    // the hero's photo there is no drawn sea, so nothing floats until the photo has gone
    u.uWaterline!.value =
      env.breach >= 0.999 ? 2 : heroPhoto ? (env.breach > 0.9 ? 2 : -1) : 0.2 + env.breach * 1.1;
    u.uPointer!.value = [env.pointer.x, env.pointer.y];
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
