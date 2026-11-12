/**
 * A small, self-contained 3D object viewer for a chapter (the Research amphora).
 * - drag to turn it (horizontal drags spin, vertical drags tilt a little); it idles in a slow spin
 * - never hijacks scrolling: no wheel zoom, and `touch-action: pan-y` keeps vertical swipes for the page
 * - renders only while on screen; the model is fetched when the chapter approaches
 */
import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export function mountModel(stage: HTMLElement, src: string) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.01, 20);
  camera.position.set(0, 0.15, 3.2);
  camera.lookAt(0, 0, 0);

  // underwater-ish light: cool ambient from above, a warm torch key from the front left
  scene.add(new HemisphereLight(0xbfe6f2, 0x0a1a26, 1.1));
  const key = new DirectionalLight(0xffe6c4, 2.6);
  key.position.set(-1.5, 1.2, 2);
  scene.add(key);
  const rim = new DirectionalLight(0x6fd3ff, 1.2);
  rim.position.set(2, 0.5, -2);
  scene.add(rim);

  const pivot = new Group();
  const tilt = new Group();
  tilt.add(pivot);
  scene.add(tilt);

  let ready = false;
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
    src,
    (gltf) => {
      const model = gltf.scene;
      // centre it and scale it to a unit-ish size, whatever the source units
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const centre = box.getCenter(new Vector3());
      model.position.sub(centre);
      // 1.28: 20% smaller than the first cut (1.6), more water around it
      const s = 1.28 / Math.max(size.x, size.y, size.z);
      pivot.scale.setScalar(s);
      pivot.add(model);
      ready = true;
      stage.classList.add('is-ready');
      draw();
    },
    undefined,
    () => stage.classList.add('is-failed'),
  );

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  };
  new ResizeObserver(resize).observe(stage);

  // drag to rotate, with a little inertia
  let spin = 0;
  let pitch = 0.12;
  let velocity = reduced ? 0 : 0.25; // rad/s idle spin
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = performance.now();
    canvas.setPointerCapture(e.pointerId);
    stage.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    spin += dx * 0.01;
    pitch = Math.max(-0.6, Math.min(0.6, pitch + dy * 0.006));
    velocity = (dx * 0.01) / Math.max(0.016, (now - lastT) / 1000);
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;
    draw();
  });
  const release = () => {
    dragging = false;
    stage.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // keyboard: arrows turn it (the stage is focusable)
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      spin += e.key === 'ArrowLeft' ? -0.3 : 0.3;
      velocity = 0;
      e.preventDefault();
      draw();
    }
  });

  function draw() {
    if (!ready) return;
    pivot.rotation.y = spin;
    tilt.rotation.x = pitch;
    renderer.render(scene, camera);
  }

  let visible = false;
  let raf = 0;
  let prev = 0;
  const loop = (t: number) => {
    raf = 0;
    if (!visible) return;
    const dt = prev ? Math.min(0.05, (t - prev) / 1000) : 0;
    prev = t;
    if (!dragging) {
      // ease back toward the idle spin after a fling
      const idle = reduced ? 0 : 0.25;
      velocity += (idle - velocity) * (1 - Math.exp(-dt * 1.5));
      spin += velocity * dt;
    }
    draw();
    raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible && !raf) {
      prev = 0;
      raf = requestAnimationFrame(loop);
    }
  }).observe(stage);

  resize();
}
