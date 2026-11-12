/**
 * Maps scroll position to depth using the declared depth bands of chapters and interludes, so a
 * band's length on the page doesn't distort the depth scale. Publishes:
 * - `window.__diveDepth` and a `divedepth` event (depth + current chapter id)
 * - CSS variables on <html>: --depth-m, --breach, --dark, --torch (see cinematics.ts)
 * - `html.above-water` while the waterline is still in frame
 */
import { MAX_DEPTH } from './depth';
import { cinematics } from './cinematics';

declare global {
  interface Window {
    __diveDepth?: number;
    /** smoothed pointer, -1..1 (y up); written by DepthJourney, read by the scene */
    __divePointer?: { x: number; y: number };
  }
  interface WindowEventMap {
    divedepth: CustomEvent<{ depth: number; section: string }>;
  }
}

interface Anchor {
  y: number;
  depth: number;
  id: string;
}

export function startDepthTracker(root: HTMLElement) {
  const bands = Array.from(root.querySelectorAll<HTMLElement>('[data-depth-start]'));
  const html = document.documentElement;
  let anchors: Anchor[] = [];
  let ticking = false;
  let last = -1;

  const measure = () => {
    const vh = window.innerHeight;
    const pinned = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxScroll = document.documentElement.scrollHeight - vh;
    anchors = bands.map((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      // an interlude's depth runs exactly while its stage is pinned: from its top reaching the
      // top of the viewport until the band after it starts to enter at the bottom
      // (with reduced motion interludes aren't pinned, so plain tops are used)
      const isInterlude = pinned && el.classList.contains('interlude');
      const afterInterlude = pinned && el.previousElementSibling?.classList.contains('interlude');
      return {
        y: isInterlude ? top + vh * 0.5 : afterInterlude ? top - vh * 0.5 : top,
        depth: Number(el.dataset.depthStart),
        // interludes report the chapter they lead into
        id: el.dataset.chapter ?? el.id,
      };
    });
    // depth 0 at scroll 0; final depth when the page is fully scrolled
    if (anchors[0]) anchors[0].y = Math.max(anchors[0].y, vh * 0.5);
    anchors.push({ y: maxScroll + vh * 0.5, depth: MAX_DEPTH, id: anchors.at(-1)?.id ?? '' });
    last = -1;
    update();
  };

  const update = () => {
    ticking = false;
    const probe = window.scrollY + window.innerHeight * 0.5;
    let depth = 0;
    let section = anchors[0]?.id ?? '';
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i]!;
      const b = anchors[i + 1]!;
      if (probe < a.y) break;
      section = a.id;
      const t = Math.min(1, (probe - a.y) / Math.max(1, b.y - a.y));
      depth = a.depth + (b.depth - a.depth) * t;
    }
    if (Math.abs(depth - last) < 0.02) return;
    last = depth;
    window.__diveDepth = depth;

    const c = cinematics(depth);
    const s = html.style;
    s.setProperty('--depth-m', depth.toFixed(2));
    s.setProperty('--breach', c.breach.toFixed(3));
    s.setProperty('--dark', c.dark.toFixed(3));
    s.setProperty('--torch', c.torch.toFixed(3));
    html.classList.toggle('above-water', c.breach < 0.6);

    window.dispatchEvent(new CustomEvent('divedepth', { detail: { depth, section } }));
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
  new ResizeObserver(measure).observe(root);
  measure();
}

/** Smoothed pointer shared by the torch (shader) and the torch text mask (CSS). */
export function startPointer() {
  const p = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  window.__divePointer = p;
  const html = document.documentElement;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      target.x = (e.clientX / innerWidth) * 2 - 1;
      target.y = -((e.clientY / innerHeight) * 2 - 1);
    },
    { passive: true },
  );
  let lx = 9;
  let ly = 9;
  const tick = () => {
    p.x += (target.x - p.x) * 0.08;
    p.y += (target.y - p.y) * 0.08;
    if (Math.abs(p.x - lx) > 0.002 || Math.abs(p.y - ly) > 0.002) {
      lx = p.x;
      ly = p.y;
      // same mapping as torchBeam() in scene/glsl.ts
      html.style.setProperty('--mx', `${(50 + p.x * 32).toFixed(2)}%`);
      html.style.setProperty('--my', `${(45 - p.y * 28).toFixed(2)}%`);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
