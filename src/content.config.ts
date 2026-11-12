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

/** Exploration & conservation projects share one shape (objective → findings). */
const project = z.object({
  title: z.string(),
  summary: z.string(),
  date: z.coerce.date(),
  location: z.string(),
  depthRange: z.string().optional(),
  objective: z.string(),
  participants: z.array(z.string()).default([]),
  process: z.string().optional(),
  findings: z.string().optional(),
  /** organisations involved; describe the relationship accurately (e.g. "volunteer with") */
  organisations: z.array(z.object({ name: z.string(), relationship: z.string() })).default([]),
  cover: media.optional(),
  gallery: z.array(media).default([]),
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

const courses = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    pathway: z.enum(['recreational', 'foundational', 'technical', 'ccr']),
    order: z.number(),
    summary: z.string(),
    prerequisites: z.array(z.string()).default([]),
    /** link to the official GUE standards page for this course */
    standardsUrl: z.url().optional(),
    /** only true once Nevcan is authorised to teach it */
    bookable: z.boolean().default(false),
    featured: z.boolean().default(false),
    draft: z.boolean().default(true),
  }),
});

export const collections = { exploration, conservation, courses };
