/**
 * Run `cb` once the visitor shows intent to move (scroll, wheel, touch, pointer, key), or right
 * away if the page already opened scrolled (deep link / restored scroll). Keeps below-the-fold
 * work such as GSAP timelines off the critical path.
 */
export function onFirstIntent(cb: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    events.forEach((ev) => window.removeEventListener(ev, run));
    cb();
  };
  const events = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
  if (window.scrollY > 0 || location.hash) {
    run();
    return;
  }
  events.forEach((ev) => window.addEventListener(ev, run, { passive: true, once: true }));
}
