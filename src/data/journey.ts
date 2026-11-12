/**
 * Homepage journey: chapters on the way from the surface to 120 m.
 * Depth bands are creative guidelines (tunable). Copy uses only facts confirmed in the brief;
 * anything unconfirmed is marked `todo`.
 */

/** How the journey moves *into* a chapter. */
export type TransitionKind = 'breach' | 'card' | 'torch';

/** How a chapter's clip is composited over the water. */
export type ClipBlend = 'normal' | 'screen' | 'torchlit';

export interface JourneyItem {
  title: string;
  text?: string;
  /** shown as a status tag, e.g. "Coming later" */
  tag?: string;
  /** placeholder content awaiting real copy / verification */
  todo?: boolean;
  /** courses / sub-items shown as chips inside a card */
  tags?: string[];
  /** chip colour for this card */
  tone?: 'mint' | 'amber' | 'violet';
  /** a wider card on its own row (services beyond the course pathway) */
  wide?: boolean;
  /** shows a forward arrow (the card will lead to a detail page) */
  arrow?: boolean;
}

export interface JourneySection {
  id: string;
  /** film-style chapter number */
  chapter: string;
  depthStart: number;
  depthEnd: number;
  eyebrow: string;
  title: string;
  lede?: string;
  cue?: string;
  items?: JourneyItem[];
  /** `tone: 'mint'` renders the button like a mint label */
  cta?: { label: string; href: string; tone?: 'mint' };
  align?: 'start' | 'end' | 'center';
  /** placeholder stock clip in /public/media (see CREDITS.md); never Nevcan's own dives */
  clip?: string;
  blend?: ClipBlend;
  /** show the footage in its own colours: no depth tint or darkening (it carries its own mood) */
  natural?: boolean;
  /** the clip is a photograph (`/media/<clip>.webp`), shown still rather than as a video */
  still?: boolean;
  /** who shot the clip, shown vertically in the corner while it plays (the site's only public credit) */
  credit?: string;
  transition?: TransitionKind;
  /** an interactive 3D object beside the copy (drag to rotate) */
  model?: { src: string; label: string };
  /** a transition played after this chapter, before the footer (from `depthEnd` on) */
  outro?: 'torch';
  /** a photograph (`/media/<name>.webp`) that takes over once the outro's lights are out;
   *  without one the outro plays on empty dark water */
  outroClip?: string;
  /** the last chapter before Contact (carries the journey disclaimer) */
  finale?: boolean;
}

export const journey: JourneySection[] = [
  {
    id: 'surface',
    chapter: '00',
    depthStart: 0,
    depthEnd: 12,
    eyebrow: 'Surface',
    title: 'Nevcan Uludaş',
    lede: 'GUE Instructor · Data-Driven Explorer',
    // the over-under photo (public/media/surface-overunder.webp), retouched, sky transparent
    credit: 'Photo: Julian Mühlenhaus',
    cue: 'Scroll to descend',
    align: 'center',
  },
  {
    id: 'about',
    chapter: '01',
    depthStart: 12,
    depthEnd: 21,
    eyebrow: 'About',
    title: 'An explorer who teaches',
    lede: 'Diver, educator and explorer, with roots in underwater archaeology research and software development.',
    items: [
      { title: '2008', text: 'Started diving' },
      { title: '2011', text: 'Became a diving instructor' },
      { title: '2022', text: 'GUE Instructor' },
      { title: '2026', text: 'GUE Instructor Trainer' },
    ],
    cta: { label: 'More about Nev', href: '/about' },
    align: 'start',
    // Nevcan's own footage: diver with torch and two cuttlefish on the reef
    clip: 'about-cuttlefish',
    credit: 'Footage: Akın Bağcılar',
    transition: 'breach',
  },
  {
    id: 'education',
    chapter: '02',
    depthStart: 21,
    depthEnd: 30,
    eyebrow: 'Education',
    // `\n` = a deliberate line break on wider screens
    title: 'Pathways',
    lede: 'Global Underwater Explorers training, a progression from your first breath to technical diving.',
    items: [
      {
        title: 'Recreational',
        text: 'A solid foundation, all the way to decompression and trimix.',
        tone: 'mint',
        tags: ['Open Water', 'Adv. OW', 'Master Diver'],
      },
      {
        title: 'Auxiliary Training',
        text: 'Focused courses that add one skill at a time.',
        tone: 'amber',
        tags: ['DPV-1', 'Gas Blender', 'All Primers'],
      },
      {
        title: 'Technical',
        text: 'Deeper, longer, further in.',
        tone: 'violet',
        tags: ['Tech. Fundamentals', 'CCR Fundamentals'],
      },
      {
        title: 'Professional',
        text: 'For divers who want to become GUE instructors.',
      },
      {
        title: 'Coaching',
        text: 'For divers who want to sharpen their skills.',
      },
    ],
    cta: { label: 'Explore pathways', href: '/#education' },
    align: 'end',
    // Nevcan's own footage: diver in doubles on a DPV
    clip: 'education-dpv',
    credit: 'Footage: Lütfü Tanrıöver',
    transition: 'card',
  },
  {
    id: 'conservation',
    chapter: '03',
    depthStart: 30,
    depthEnd: 51,
    eyebrow: 'Conservation',
    title: 'Leave the sea better than you found it',
    lede: 'Underwater cleanups, ghost-net recovery and the protection of underwater cultural heritage.',
    cta: { label: 'Conservation projects', href: '/#conservation', tone: 'mint' },
    align: 'start',
    // Nev's own footage: a shallow reef of red algae and sponges (GoPro, 2026-05-24); the
    // fish clip (conservation-fish, Akın Bağcılar) is kept for the Conservation detail page
    clip: 'conservation-reef',
    natural: true,
    credit: 'Footage: Nevcan Uludaş',
    transition: 'card',
  },
  {
    id: 'exploration',
    chapter: '04',
    depthStart: 51,
    depthEnd: 75,
    eyebrow: 'Exploration',
    title: 'Where the light runs out',
    lede: 'Cave, wreck and archaeology projects. Every dive, documented.',
    // one card per field, its projects as chips (same layout as Education's pathways)
    items: [
      { title: 'Cave', tone: 'violet', tags: ['KarstDive: Western Taurus', 'KarstDive: Amanus'] },
      { title: 'Wreck', tone: 'amber', tags: ['ProjectXplore: Gallipoli Wrecks'] },
      { title: 'Archaeology', tone: 'mint', tags: ['Eastern Mediterranean Amphoras'] },
    ],
    cta: { label: 'See the expeditions', href: '/#exploration' },
    align: 'end',
    // Nevcan's own cave footage
    clip: 'exploration-cave',
    natural: true,
    credit: 'Footage: Ricardo Constantino',
    transition: 'card',
  },
  {
    id: 'research',
    chapter: '05',
    depthStart: 75,
    depthEnd: 90,
    eyebrow: 'Research',
    // draft copy: to be agreed with Nevcan
    title: 'Data from the deep',
    lede: 'Every dive is a survey: we dive as citizen scientists, collecting data and samples for the researchers.',
    // Nevcan in the beam of a torch
    clip: 'research-diver',
    still: true,
    credit: 'Photo: Mahmut İğde',
    items: [
      { title: 'Photogrammetry', tags: ['Documentation'], tone: 'mint', arrow: true },
      // post-dive Doppler bubble counts are shared through DAN's Donate Your Dive programme
      { title: 'DAN Donate Your Dive', tags: ['Dive safety data'], tone: 'amber', arrow: true },
    ],
    // the Keay LII amphora from the Alfieri A wreck (Capo Colonna, MUSAS CAPCOL-27), as on
    // wetnote.com; model author and licence still to be confirmed (CREDITS.md)
    model: { src: '/models/amphora.glb', label: '3D model of a Keay LII amphora' },
    align: 'start',
    transition: 'card',
  },
  {
    id: 'community',
    chapter: '06',
    depthStart: 90,
    // then the torch outro ("Down here, daylight is gone"), then Contact at 120 m
    depthEnd: 114,
    eyebrow: 'Community',
    title: 'Nobody dives alone',
    lede: 'The wider GUE family,\nGUE Türkiye and the people I dive with.',
    cta: { label: 'Events and collaborations', href: '/#community' },
    align: 'center',
    // Nevcan and his team in a wreck, torches on; once the lights go out it shows only in the beam
    clip: 'community-team',
    // shot for GUE, which holds the rights; the photographer (possibly Andrei Voinigescu) is
    // still to be confirmed, so the owner is credited until then
    credit: 'Photo: Global Underwater Explorers',
    still: true,
    transition: 'card',
    outro: 'torch',
    finale: true,
  },
];
