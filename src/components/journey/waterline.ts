/**
 * The opening's copy (portrait, name, role) rises slowly as you scroll while the waterline rises
 * fast, so the water overtakes it: whatever is below the waterline is cut away, as if it were
 * behind the water. Nothing fades.
 *
 * The waterline's screen position must match what is drawn:
 * - WebGL scene: y (from the bottom) = 0.2 + 1.1 · breach, with the scene's own damped breach
 *   (Backdrop.tsx, `wl`), published as window.__sceneBreach by DepthScene
 * - CSS fallback: the over-under frame is 80% tall and moves up by 101% of itself · breach
 *   (StaticFallback.astro)
 */
declare global {
  interface Window {
    __sceneBreach?: number;
  }
}

export function startWaterlineClip(root: HTMLElement) {
  const items = Array.from(
    root.querySelectorAll<HTMLElement>('.hero .portrait-ring, .hero .title, .hero .lede'),
  );
  if (!items.length) return;
  const html = document.documentElement;
  let last = '';

  const frame = () => {
    requestAnimationFrame(frame);
    const vh = window.innerHeight;
    const sceneOn = html.classList.contains('scene-active');
    const breach = sceneOn
      ? (window.__sceneBreach ?? 0)
      : Number(getComputedStyle(html).getPropertyValue('--breach')) || 0;
    const waterY = sceneOn ? vh * (1 - (0.2 + 1.1 * breach)) : vh * 0.8 * (1 - 1.01 * breach);
    const cuts = items.map((el) => {
      const r = el.getBoundingClientRect();
      return Math.max(0, Math.ceil(r.bottom - waterY));
    });
    const key = cuts.join(',');
    if (key === last) return;
    last = key;
    items.forEach((el, i) => {
      el.style.clipPath = cuts[i]! > 0 ? `inset(-50% -50% ${cuts[i]}px -50%)` : '';
    });
  };
  requestAnimationFrame(frame);
}
