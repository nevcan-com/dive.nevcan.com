/**
 * Cinematic transitions play on their own clock instead of following the scroll wheel.
 *
 * Chapters scroll freely. Once a visitor scrolls a chapter's content mostly off screen, the page
 * takes over: it locks input and scrolls itself through the next interlude at a fixed pace, then
 * settles on the next chapter's content. The same happens backwards when scrolling up.
 *
 * Everything cinematic (depth, the WebGL crossfade, the GSAP card and torch timelines) is
 * already a function of scroll position. Driving the scroll position over time therefore turns
 * every transition into a timed one, with nothing duplicated.
 *
 * An interlude can also declare holds (data-holds): playback stops there until the visitor
 * scrolls again, e.g. on each line of the torch outro.
 *
 * Timeline of a forward gate (the reverse mirrors it):
 *   lead   scroll the rest of the old chapter away                ~0.35 s
 *   stage  the pinned interlude plays (out, hold, in)             data-duration
 *   settle the next chapter's content rises into place, easing out ~0.7 s
 */

declare global {
  interface Window {
    /** true while a transition is playing; the scene damps depth faster meanwhile */
    __diveAutoplay?: boolean;
  }
}

interface Gate {
  el: HTMLElement;
  prev: HTMLElement | null;
  next: HTMLElement | null;
  /** seconds for the pinned part */
  duration: number;
  /** points (0..1 through the pinned part) where playback stops until the visitor scrolls again */
  holds: number[];
}

interface Key {
  y: number;
  t: number;
  ease: (x: number) => number;
}

const LEAD = 0.35;
const SETTLE = 0.7;
/** input stays blocked a moment after landing, so trackpad inertia can't start the next gate */
const COOLDOWN = 350;
/** longer after stopping on a hold, so the momentum of the scroll that started it dies out */
const HOLD_COOLDOWN = 700;

const linear = (x: number) => x;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
/** the opening hands over to About once the waterline has risen half the screen (it rises
    1.1 screens over BREACH_END = 8 m, from 20% up: half a screen is ~3.6 m) */
const HERO_GO_DEPTH = 3.6;
/** seconds for the whole surface → About glide */
const HERO_TO_ABOUT = 2.2;
const easeOut = (x: number) => 1 - (1 - x) ** 3;
/** arrives softly on a hold */
const easeOutSoft = (x: number) => 1 - (1 - x) ** 2;

const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

export function startAutoplay(root: HTMLElement) {
  const html = document.documentElement;
  const gates: Gate[] = Array.from(root.querySelectorAll<HTMLElement>('.interlude')).map((el) => {
    const prev = el.previousElementSibling as HTMLElement | null;
    const next = el.nextElementSibling as HTMLElement | null;
    return {
      el,
      prev: prev?.matches('.band') ? prev : null,
      // the outro leads into the footer, which then counts as the next "chapter"
      next: next?.matches('.band') ? next : document.querySelector<HTMLElement>('[data-footer]'),
      duration: Number(el.dataset.duration) || 2.2,
      holds: (el.dataset.holds ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number)
        .sort((a, b) => a - b),
    };
  });
  const about = root.querySelector<HTMLElement>('#about');
  if (!gates.length && !about) return;

  let busy = false;
  let blockUntil = 0;
  let lastY = window.scrollY;
  let bypassUntil = 0;
  let ticking = false;

  const absTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;
  const absBottom = (el: Element) => el.getBoundingClientRect().bottom + window.scrollY;

  /** scroll position that frames a chapter's content: centred, or its top at 15% if taller */
  const frameNext = (band: HTMLElement, vh: number) => {
    const inner = band.querySelector('.band-inner') ?? band;
    const r = inner.getBoundingClientRect();
    return absTop(inner) - Math.max(vh * 0.15, (vh - r.height) / 2);
  };
  const framePrev = (band: HTMLElement, vh: number) => {
    const inner = band.querySelector('.band-inner') ?? band;
    const r = inner.getBoundingClientRect();
    return absBottom(inner) - vh + Math.max(vh * 0.15, (vh - r.height) / 2);
  };

  const play = (keys: Key[], cooldown = COOLDOWN) => {
    busy = true;
    window.__diveAutoplay = true;
    html.classList.add('journey-autoplay');
    const t0 = performance.now();
    const total = keys.at(-1)!.t;
    const step = (now: number) => {
      const t = Math.min(total, (now - t0) / 1000);
      let i = 1;
      while (i < keys.length - 1 && t > keys[i]!.t) i++;
      const a = keys[i - 1]!;
      const b = keys[i]!;
      const span = b.t - a.t;
      const p = span > 0 ? b.ease((t - a.t) / span) : 1;
      window.scrollTo({ top: a.y + (b.y - a.y) * p, behavior: 'instant' });
      if (t < total) {
        requestAnimationFrame(step);
        return;
      }
      lastY = window.scrollY;
      busy = false;
      window.__diveAutoplay = false;
      html.classList.remove('journey-autoplay');
      blockUntil = performance.now() + cooldown;
    };
    requestAnimationFrame(step);
  };

  const check = () => {
    ticking = false;
    const y = window.scrollY;
    const dir = Math.sign(y - lastY);
    lastY = y;
    if (busy || !dir || performance.now() < bypassUntil) return;
    const vh = window.innerHeight;
    const maxY = html.scrollHeight - vh;

    // the opening: once the water has risen about half the screen, the page carries on by
    // itself to the About chapter; scrolling back up from About returns to the surface
    if (about) {
      const aboutAt = Math.min(maxY, frameNext(about, vh));
      if (dir > 0 && y < aboutAt - 2 && (window.__diveDepth ?? 0) >= HERO_GO_DEPTH) {
        play([
          { y, t: 0, ease: linear },
          { y: aboutAt, t: HERO_TO_ABOUT * ((aboutAt - y) / aboutAt) + 0.6, ease: easeInOut },
        ]);
        return;
      }
      const aboutInnerTop = absTop(about.querySelector('.band-inner') ?? about);
      if (dir < 0 && y > 2 && y < aboutAt && aboutInnerTop - y > vh * 0.75) {
        play([
          { y, t: 0, ease: linear },
          { y: 0, t: HERO_TO_ABOUT * (y / aboutAt) + 0.6, ease: easeInOut },
        ]);
        return;
      }
    }

    for (const g of gates) {
      const top = absTop(g.el);
      const release = absBottom(g.el) - vh;

      if (dir > 0 && y < release) {
        // the old chapter's content is mostly gone (its last line above 25% of the viewport)
        const from = g.prev
          ? absBottom(g.prev.querySelector('.band-inner') ?? g.prev) - vh * 0.25
          : top;
        if (y < from) continue;
        const keys: Key[] = [{ y, t: 0, ease: linear }];
        let t = 0;
        if (y < top) keys.push({ y: top, t: (t += LEAD * ((top - y) / vh / 0.75)), ease: linear });
        const at = Math.max(y, top);
        const hold = g.holds.map((h) => top + h * (release - top)).find((p) => p > at + 2);
        if (hold !== undefined) {
          keys.push({
            y: hold,
            t: (t += g.duration * ((hold - at) / (release - top))),
            ease: easeOutSoft,
          });
          play(keys, HOLD_COOLDOWN);
          return;
        }
        // the footer is the end of the page: settle at the very bottom, so all of it shows
        const toFooter = g.next?.matches('[data-footer]');
        const end = toFooter
          ? maxY
          : Math.min(maxY, g.next ? Math.max(release, frameNext(g.next, vh)) : release);
        keys.push({
          y: release,
          t: (t += g.duration * ((release - at) / (release - top))),
          ease: linear,
        });
        if (end > release + 1) keys.push({ y: end, t: (t += SETTLE), ease: easeOut });
        play(keys);
        return;
      }

      if (dir < 0 && y > top) {
        // the new chapter's content has mostly left through the bottom (its top below 75%)
        const from = g.next
          ? absTop(g.next.querySelector('.band-inner') ?? g.next) - vh * 0.75
          : release + vh * 0.1;
        if (y > Math.max(from, release)) continue;
        const keys: Key[] = [{ y, t: 0, ease: linear }];
        let t = 0;
        if (y > release)
          keys.push({
            y: release,
            t: (t += LEAD * Math.min(1, (y - release) / vh / 0.75)),
            ease: linear,
          });
        const at = Math.min(y, release);
        const hold = g.holds
          .map((h) => top + h * (release - top))
          .reverse()
          .find((p) => p < at - 2);
        if (hold !== undefined) {
          keys.push({
            y: hold,
            t: (t += g.duration * ((at - hold) / (release - top))),
            ease: easeOutSoft,
          });
          play(keys, HOLD_COOLDOWN);
          return;
        }
        const end = Math.max(0, g.prev ? Math.min(top, framePrev(g.prev, vh)) : top);
        keys.push({
          y: top,
          t: (t += g.duration * ((at - top) / (release - top))),
          ease: linear,
        });
        if (end < top - 1) keys.push({ y: end, t: (t += SETTLE), ease: easeOut });
        play(keys);
        return;
      }
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(check);
      }
    },
    { passive: true },
  );

  // while a transition plays (and briefly after), scroll input is swallowed instead of queued
  const blocking = () => busy || performance.now() < blockUntil;
  const swallow = (e: Event) => {
    if (blocking()) e.preventDefault();
  };
  window.addEventListener('wheel', swallow, { passive: false });
  window.addEventListener('touchmove', swallow, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (blocking() && SCROLL_KEYS.has(e.key)) e.preventDefault();
  });

  // in-page links (depth rail, nav) jump straight to their target, past any gate
  const bypass = () => {
    bypassUntil = performance.now() + 1200;
  };
  document.addEventListener('click', (e) => {
    if ((e.target as Element | null)?.closest?.('a[href*="#"]')) bypass();
  });
  window.addEventListener('hashchange', () => {
    bypass();
    lastY = window.scrollY;
  });
}
