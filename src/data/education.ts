/**
 * The Education page (/education): the four starting points and what each one recommends.
 * The courses themselves (facts from GUE's Standards, v10.4) live in src/content/courses/.
 * Which classes Nev teaches, and in which languages: his GUE instructor résumé (GUE_RESUME,
 * read 2026-11-13). The pathway groups and their one-line texts are his, from the homepage.
 * The recommendations are Nev's (2026-11-13): Open Water for new divers; Technical
 * Fundamentals, with a Doubles Primer first if needed, for divers coming to GUE.
 * CCR Fundamentals isn't on his résumé yet: his instructor rating is in progress (Nev,
 * 2026-11-13), so it is listed with `soon: true`.
 */
export { GUE_RESUME, GUE_SCHEDULE } from '@/data/about';

const GUE_COURSES = 'https://gue.com/diver-training/explore-gue-courses';

export const intro =
  'Global Underwater Explorers training, from your first breath to technical diving. Tell me where you are starting from, and I’ll show you the course I would recommend.';

export const teachIn = ['English', 'Turkish'];
/** where Nev teaches: Türkiye first (mostly Antalya, no city named), and he travels for courses
 *  (Nev, 2026-11-13) */
export const teachWhere = 'Based in Türkiye · available internationally';

export interface StartPath {
  /** also the URL hash: /education#certified */
  id: 'new' | 'certified' | 'gue' | 'pro';
  /** the picker's label */
  label: string;
  /** a short line under the label */
  hint: string;
  title: string;
  text: string;
  /** recommended courses, shown large, each with its label (first = the main recommendation) */
  featured: { slug: string; badge: string }[];
  /** featured cards at equal width (two options, neither the main recommendation) */
  equalCards?: boolean;
  /** a line between the featured courses and the rest */
  note?: string;
  /** other course slugs, shown small */
  others: string[];
  othersLabel?: string;
}

export const paths: StartPath[] = [
  {
    id: 'new',
    label: 'New to diving',
    hint: 'I’ve never dived, or only tried it once',
    title: 'Start with Open Water Diver',
    text: 'One course takes you from your first breath underwater to diving independently with a buddy. You learn GUE’s configuration, buoyancy and team habits from day one, so there is nothing to unlearn later.',
    featured: [{ slug: 'open-water-diver', badge: 'Recommended' }],
    others: ['discover-diving', 'scuba-diver'],
    othersLabel: 'Other ways to start',
  },
  {
    id: 'certified',
    label: 'Certified elsewhere',
    hint: 'I dive with another agency and want to move to GUE',
    title: 'Come to GUE through Technical Fundamentals',
    text: 'Four days that refine everything you already do, to the standard GUE’s technical, cave and rebreather courses expect. It is the one certification those courses all require. If you haven’t dived doubles yet, a one-day Doubles Primer comes first.',
    featured: [
      { slug: 'technical-fundamentals', badge: 'Recommended' },
      { slug: 'doubles-primer', badge: 'New to doubles? First' },
    ],
    note: 'Not there yet? Technical Fundamentals asks for a 30 m certification and 75 dives. Performance Diver and Basic Fundamentals bring you into GUE sooner, and part of either can count toward Technical Fundamentals later.',
    others: ['drysuit-primer', 'performance-diver', 'basic-fundamentals'],
    othersLabel: 'Shorter ways in',
  },
  {
    id: 'gue',
    label: 'Already a GUE diver',
    hint: 'I hold a GUE certification and want the next step',
    title: 'Add a skill, or go deeper',
    text: 'With any GUE certification you can take the primers and auxiliary courses, one skill at a time. Advanced Open Water and Master Diver take you deeper on the recreational side; Technical Fundamentals opens technical, cave and rebreather training.',
    // Nev (2026-11-13): DPV-1 in front for GUE divers; Technical Fundamentals stays in the list
    featured: [
      { slug: 'dpv-diver-1', badge: 'Add a skill' },
      { slug: 'master-diver', badge: 'Recreational, deeper' },
    ],
    equalCards: true,
    others: [
      'advanced-open-water-diver',
      'navigation-primer',
      'rescue-primer',
      'deep-primer',
      'doubles-primer',
      'drysuit-primer',
      'gas-blender',
      'technical-fundamentals',
      'ccr-fundamentals',
    ],
    othersLabel: 'More next steps',
  },
  {
    id: 'pro',
    label: 'Become an instructor',
    hint: 'I want to teach GUE courses',
    title: 'Teach for GUE',
    // GUE: "a thorough apprentice program together with a rigorous evaluation period"
    text: 'GUE instructors are developed through an apprenticeship and a rigorous evaluation. As a GUE Instructor Trainer, I run instructor training courses (ITC) for GUE Performance Diver. Write to me about where you are now, and we’ll plan the route together.',
    featured: [],
    others: [],
  },
];

/**
 * The instructor training courses Nev runs. The endorsements (Nev, 2026-11-13): he gives the
 * first in person; the second is online, from videos of the candidate's teaching that he films
 * and shares with GUE's Instructor Evaluators. GUE lists him as an Instructor Trainer (IT) for
 * Performance Diver (gue.com/training/gue-instructors/GUE-IT-IE). GUE: "ITs can offer only the
 * first endorsement during instructor development"; an Instructor Evaluator gives the second.
 * Dates come from src/data/events.ts (an event whose title starts with the ITC's `match`).
 */
export const GUE_IT_IE = 'https://gue.com/training/gue-instructors/GUE-IT-IE';

export const instructorCourses = [
  {
    /** the page: /education/itc/<slug> */
    slug: 'performance-diver',
    /** the course a graduate goes on to teach (src/content/courses/<slug>.md) */
    teaches: 'performance-diver',
    /** true until Nev has approved the page: noindex, out of the sitemap, marked as a draft */
    draft: true,
    name: 'GUE Performance Diver ITC',
    match: 'ITC GUE Performance Diver',
    /** the instructor level the course leads to */
    rating: 'GUE Performance Diver Instructor',
    text: 'The instructor training course for GUE Performance Diver: how to teach, assess and run the course to GUE’s standards. As your Instructor Trainer, I give the first endorsement. The second is given online by GUE Instructor Evaluators: I film your teaching and share the videos with them.',
  },
];

/** how GUE develops instructors, from gue.com (diver-training, gue-instructors, GUE-IT-IE) */
export const instructorPath = [
  'GUE develops its instructors through an apprenticeship and a rigorous evaluation period.',
  'An Instructor Trainer gives the first endorsement; a GUE Instructor Evaluator gives the second. The same person never gives both.',
  'GUE instructors are expected to have exemplary diving skills and knowledge, and pass a fitness test every year.',
];

/** after Technical Fundamentals: GUE's next courses (taught by other GUE instructors) */
export const beyondTechFund = [
  { name: 'Technical Diver 1', url: `${GUE_COURSES}/technical/tech-1` },
  { name: 'Cave Diver 1', url: `${GUE_COURSES}/cave/cave-1` },
];

/** the homepage's pathway groups (names, one-line texts and chip tones are Nev's) */
export const pathways = [
  {
    id: 'recreational',
    title: 'Recreational',
    text: 'A solid foundation, all the way to decompression and trimix.',
    tone: 'mint',
  },
  {
    id: 'auxiliary',
    title: 'Auxiliary Training',
    text: 'Focused courses that add one skill at a time.',
    tone: 'amber',
  },
  { id: 'technical', title: 'Technical', text: 'Deeper, longer, further in.', tone: 'violet' },
] as const;

export type PathwayId = (typeof pathways)[number]['id'];

/** the coaching service beyond the course pathway (homepage copy) */
export const coaching = {
  title: 'Coaching',
  text: 'For divers who want to sharpen their skills.',
};

/**
 * What a course costs, the same for every course (Nev, 2026-11-13). His instructor fee is the
 * course's `fee` (euros); the rest is listed under it on every course page. GUE's own term for
 * its part is the "registration fee" ("separate from any course fees charged by your
 * instructor"; covers materials, processing and certification; amounts per course on GUE_FEES).
 */
export const GUE_FEES = 'https://www.gue.com/how-much-course-registration-fee';

export const PRICING: { text: string; link?: { label: string; href: string } }[] = [
  {
    text: 'GUE’s registration fee (materials, processing and certification) is paid to GUE separately.',
    link: { label: 'GUE’s fees per course', href: GUE_FEES },
  },
  { text: 'Your own travel, accommodation and dive-centre costs are yours.' },
  { text: 'My travel, accommodation and diving costs are shared among the students.' },
];

/** the configuration line on a course page */
export const BASE_EQUIPMENT: Record<string, string> = {
  single: 'GUE single tank configuration',
  double: 'GUE double tank configuration',
  'single-or-double': 'GUE single or double tank configuration',
  ccr: 'GUE CCR configuration, on a GUE-approved closed-circuit rebreather',
  none: '',
};

export const EQUIPMENT_NOTE =
  'GUE’s standard configuration: backplate and harness, a minimalist back-mounted wing, a long hose (1.5–2 m) on the primary regulator and a necklaced backup, an analogue pressure gauge, a low-volume mask and a backup mask, rigid non-split fins, a timer/depth gauge, a wrist compass, a cutting device, wetnotes, and an SMB with a spool. Not sure about yours? Write before the course and we’ll check it together.';
