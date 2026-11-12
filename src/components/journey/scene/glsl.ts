/** Shared GLSL chunks. */

export const noise = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
    return v;
  }
`;

/**
 * Diver torch beam in screen space (uv 0..1, aspect-corrected x).
 * Origin just below the bottom edge, aimed slightly up into the scene.
 */
export const torch = /* glsl */ `
  float torchBeam(vec2 uv, float aspect, vec2 aim) {
    vec2 p = vec2(uv.x * aspect, uv.y);
    vec2 origin = vec2(0.62 * aspect, -0.25);
    // keep in sync with startPointer() in tracker.ts (CSS torch mask)
    vec2 target = vec2((0.5 + aim.x * 0.32) * aspect, 0.55 + aim.y * 0.28);
    vec2 dir = normalize(target - origin);
    vec2 d = p - origin;
    float along = dot(d, dir);
    float across = length(d - dir * along);
    float width = 0.05 + along * 0.32;
    float cone = smoothstep(width, width * 0.35, across) * smoothstep(0.0, 0.25, along);
    float falloff = exp(-along * 1.15);
    float spot = exp(-dot(p - target, p - target) * 14.0);
    return cone * falloff * 1.4 + spot * 0.55;
  }
`;
