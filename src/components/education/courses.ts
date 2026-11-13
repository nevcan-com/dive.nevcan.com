import { getCollection, type CollectionEntry } from 'astro:content';
import { pathways, type PathwayId } from '@/data/education';

export type Course = CollectionEntry<'courses'>;

const PATHWAY_ORDER = pathways.map((p) => p.id);

/** every course, in pathway order, then each pathway's own order */
export async function getCourses(): Promise<Course[]> {
  const all = await getCollection('courses');
  return all.sort(
    (a, b) =>
      PATHWAY_ORDER.indexOf(a.data.pathway) - PATHWAY_ORDER.indexOf(b.data.pathway) ||
      a.data.order - b.data.order,
  );
}

export async function getCourseMap(): Promise<Map<string, Course>> {
  return new Map((await getCourses()).map((c) => [c.id, c]));
}

export const courseHref = (c: Course) => `/education/${c.id}`;

export const pathwayOf = (id: PathwayId) => pathways.find((p) => p.id === id)!;

/** what the search box matches against (lower case) */
export const searchText = (c: Course) =>
  [c.data.name, c.data.short, c.data.level, c.data.summary, c.data.headline, ...c.data.keywords]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/** Nev's fee, always in euros: e.g. "€1,200" */
export const formatFee = (fee: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(fee);
