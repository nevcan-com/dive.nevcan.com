/**
 * Where the page stops when it arrives at a chapter. Shared by in-page links (AnchorCenter), the
 * timed transitions (autoplay.ts) and the depth tracker, so a link, a transition and the depth
 * rail all agree on the same resting point, and the rail reads the chapter's own depth there.
 *
 * - The chapter's content fits on screen: it sits in the middle of the viewport.
 * - It is taller than the screen: its eyebrow sits below the nav by the same distance as the
 *   eyebrow sits above the title.
 *
 * Measured from layout offsets rather than getBoundingClientRect, so the content's reveal
 * animation (a 24px rise, JourneySection.astro) doesn't shift the target while it plays.
 */

declare global {
  interface Window {
    /** true while an in-page link glides to its target (AnchorCenter.astro) */
    __diveJumping?: boolean;
  }
}

/** document-relative top of an element, ignoring transforms */
function layoutTop(el: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

function navBottom(): number {
  return document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
}

interface Frame {
  /** content top / height (document coordinates) */
  top: number;
  height: number;
  /** eyebrow top, where a tall chapter is aligned */
  head: number;
  /** eyebrow → title distance */
  gap: number;
}

function measure(band: HTMLElement): Frame {
  const inner = band.querySelector<HTMLElement>('.band-inner') ?? band;
  const top = layoutTop(inner);
  const eyebrow = inner.querySelector<HTMLElement>(':scope > .eyebrow');
  const title = inner.querySelector<HTMLElement>(':scope > .title');
  let gap = 32;
  let head = top;
  if (eyebrow && title) {
    gap = Math.max(8, title.offsetTop - (eyebrow.offsetTop + eyebrow.offsetHeight));
    head = top + eyebrow.offsetTop;
  }
  return { top, height: inner.offsetHeight, head, gap };
}

const fits = (f: Frame, vh: number, nav: number) => (vh - f.height) / 2 >= nav + f.gap;

/** scroll position that frames a chapter, arriving from above (or by link) */
export function arriveY(band: HTMLElement): number {
  if (band.classList.contains('hero')) return 0;
  const vh = window.innerHeight;
  const nav = navBottom();
  const f = measure(band);
  return fits(f, vh, nav) ? f.top + f.height / 2 - vh / 2 : f.head - nav - f.gap;
}

/**
 * Scroll position that frames the footer: the very bottom of the page, unless the footer is
 * taller than the screen (phones); then its social links sit below the nav like a chapter's
 * eyebrow, by the chapters' eyebrow → title distance.
 */
export function footerY(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const footer = document.querySelector<HTMLElement>('[data-footer]');
  if (!footer) return max;
  const head = footer.querySelector<HTMLElement>('.social') ?? footer;
  const chapter = document.querySelector<HTMLElement>('.band:not(.hero)');
  const gap = chapter ? measure(chapter).gap : 24;
  return Math.max(0, Math.min(max, layoutTop(head) - navBottom() - gap));
}

/** scroll position that frames a chapter arriving from below: a tall one shows its end */
export function arriveFromBelowY(band: HTMLElement): number {
  const vh = window.innerHeight;
  const nav = navBottom();
  const f = measure(band);
  return fits(f, vh, nav) ? arriveY(band) : f.top + f.height - vh + f.gap;
}
