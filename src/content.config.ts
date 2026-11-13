/**
 * Content collections. Schemas are defined now so detail pages can slot in during Milestone 2.
 * Add entries as Markdown/MDX files in src/content/<collection>/. Never add unverified claims.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const media = z.object({
  src: z.string(),
  alt: z.string().min(1, 'alt text is required'),
  credit: z.string().optional(),
  kind: z.enum(['image', 'video']).default('image'),
});

/** a published source: every fact on a project page links to one */
const source = z.object({
  title: z.string(),
  publisher: z.string(),
  /** e.g. "17 Nov 2025" */
  date: z.string().optional(),
  url: z.url(),
});

/** Exploration & conservation projects share one shape (objective → findings). */
const project = z.object({
  title: z.string(),
  /** a line under the title (what the project is, in plain words) */
  subtitle: z.string().optional(),
  summary: z.string(),
  date: z.coerce.date(),
  location: z.string(),
  /** exploration: which field it sits in (the homepage's cards) */
  field: z.enum(['cave', 'wreck', 'archaeology']).optional(),
  /** who leads it, when it isn't Nev's own project */
  lead: z.string().optional(),
  /** the label for `lead` (default "Led by"), e.g. "Site managed by" when nobody leads a project */
  leadLabel: z.string().optional(),
  /** Nev's position in one line, e.g. "Volunteer project diver", "Project manager" */
  position: z.string().optional(),
  /** what Nev did, in his words */
  role: z.array(z.string()).default([]),
  depthRange: z.string().optional(),
  objective: z.string(),
  /** the heading over `sites` (defaults: "Sites" / "Where I dived with the team") */
  sitesEyebrow: z.string().optional(),
  sitesTitle: z.string().optional(),
  /** the sites worked on, each with its published sources */
  sites: z
    .array(
      z.object({
        name: z.string(),
        /** other names the press uses */
        aka: z.string().optional(),
        place: z.string(),
        year: z.string(),
        facts: z.array(z.object({ k: z.string(), v: z.string() })).default([]),
        text: z.string(),
        sources: z.array(source).min(1),
      }),
    )
    .default([]),
  /** other sites named by the press or the site's managers, names only, with a note on where
   *  the list comes from */
  wrecks: z
    .array(
      z.object({
        name: z.string(),
        area: z.string().optional(),
        depth: z.string().optional(),
        /** the site's own page (e.g. on the park's website) */
        url: z.url().optional(),
      }),
    )
    .default([]),
  wrecksNote: z.string().optional(),
  /** replaces the page's closing note about sources */
  sourceNote: z.string().optional(),
  /** project-level sources */
  sources: z.array(source).default([]),
  participants: z.array(z.string()).default([]),
  process: z.string().optional(),
  findings: z.string().optional(),
  /** organisations involved; describe the relationship accurately (e.g. "volunteer with") */
  organisations: z.array(z.object({ name: z.string(), relationship: z.string() })).default([]),
  cover: media.optional(),
  gallery: z.array(media).default([]),
  /** YouTube videos of Nev's own dives (poster: public/media/video/<id>.webp) */
  videos: z
    .array(
      z.object({
        youtube: z.string(),
        title: z.string(),
        caption: z.string().optional(),
        credit: z.string().optional(),
      }),
    )
    .default([]),
  draft: z.boolean().default(true),
});

const exploration = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/exploration' }),
  schema: project,
});

const conservation = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/conservation' }),
  schema: project,
});

/**
 * The courses Nev teaches (his GUE résumé), one file per course; the file name is the URL
 * (/education/<slug>). Frontmatter facts come from GUE's Standards (`standards`: the course's
 * section of GUE General Training Standards, Policies, and Procedures, v10.4), paraphrased; the
 * Markdown body ("why this course", how the days run) is Nev's to approve.
 */
const courses = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/courses' }),
  schema: z.object({
    name: z.string(),
    /** the short form people search for, e.g. "AOWD", "DPV-1" */
    short: z.string().optional(),
    /** GUE's own level name, e.g. "Recreational Diver Level 1" */
    level: z.string().optional(),
    /** the homepage's pathway groups (chip colour) */
    pathway: z.enum(['recreational', 'auxiliary', 'technical']),
    /** order inside its pathway */
    order: z.number(),
    summary: z.string(),
    /** the one concrete line: what a diver can do once certified */
    headline: z.string(),
    facts: z.object({
      age: z.number(),
      days: z.string(),
      dives: z.string().optional(),
      hours: z.string().optional(),
      depth: z.string().optional(),
      deco: z.string().optional(),
      gases: z.string().optional(),
    }),
    /** "After this course you can …" */
    outcomes: z.array(z.string()).min(1),
    prerequisites: z.array(z.string()).min(1),
    /** academic topics, shortened */
    topics: z.array(z.string()).default([]),
    /** the configuration the course is taught in, plus anything extra */
    equipment: z.object({
      base: z.enum(['single', 'double', 'single-or-double', 'ccr', 'none']),
      plus: z.array(z.string()).default([]),
    }),
    /** training that can count toward this course (at the instructor's discretion) */
    credit: z.string().optional(),
    /** slugs of the courses this one leads to */
    next: z.array(z.string()).default([]),
    /** Nev's instructor fee in euros (fixed); without it the page says "on request". What else
     *  a student pays follows one rule for every course: PRICING in src/data/education.ts */
    fee: z.number().optional(),
    /** the course page on gue.com */
    gueUrl: z.url(),
    /** e.g. "3.1.3" (section in Standards v10.4) */
    standards: z.string(),
    /** extra words the search should match ("scooter", "trimix") */
    keywords: z.array(z.string()).default([]),
    /** Nev will teach it soon (his instructor rating is in progress): shown, not yet bookable */
    soon: z.boolean().default(false),
    /** true until Nev has approved the page: noindex, out of the sitemap, marked as a draft */
    draft: z.boolean().default(true),
  }),
});

export const collections = { exploration, conservation, courses };
