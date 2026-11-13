/**
 * The Exploration page (/exploration). The fields and project names are Nev's, from the
 * homepage (journey.ts); a project with a page in src/content/exploration/ links to it.
 * Numbers and skills: his GUE instructor résumé (GUE_RESUME, read 2026-11-13).
 * Archaeology: only what the press or the project has published (see that page's sources).
 */
export { GUE_RESUME } from '@/data/about';

export const intro =
  'Cave, wreck and archaeology projects, where diving is the means and the data is the goal. I join teams as a project diver: technical and rebreather diving, survey and documentation, on sites most divers never reach.';

/** from the résumé's "Diving Experience" */
export const numbers = [
  { value: '1000+', label: 'Wreck dives' },
  { value: '200+', label: 'Trimix dives' },
  { value: '100+', label: 'Rebreather dives' },
  { value: '50+', label: 'Cave dives' },
];

export interface FieldProject {
  name: string;
  /** a page in src/content/exploration/<slug>.md */
  slug?: string;
  /** a short line under the name */
  note?: string;
  /** Nev's role, when it is on his résumé */
  role?: string;
  href?: string;
}

export const fields: {
  id: 'cave' | 'wreck' | 'archaeology';
  title: string;
  text: string;
  tone: 'mint' | 'amber' | 'violet';
  projects: FieldProject[];
}[] = [
  {
    id: 'cave',
    title: 'Cave',
    text: 'Exploring and surveying underwater caves, and turning the dives into maps.',
    tone: 'violet',
    projects: [
      // Amanus: Nev's own cave project in Hatay, since 2024. Western Taurus: the continuation of
      // Karstdive '95 (WKPP and SAD; gue.com/karstdive-95), Nev project manager ("Karstdive25"
      // on his résumé), in planning. KarstDive is Nev's prefix for his cave projects.
      {
        name: 'KarstDive: Amanus',
        slug: 'karstdive-amanus',
        note: 'Samandağ, Hatay · survey in progress',
      },
      {
        name: 'KarstDive: Western Taurus',
        slug: 'karstdive-western-taurus',
        note: 'In planning · continuing Karstdive ’95',
      },
    ],
  },
  {
    id: 'wreck',
    title: 'Wreck',
    text: 'Technical dives on historic wrecks.',
    tone: 'amber',
    projects: [
      {
        name: 'Gallipoli Wrecks',
        slug: 'gallipoli-wrecks',
        note: 'Gallipoli Historical Underwater Park, Çanakkale',
      },
    ],
  },
  {
    id: 'archaeology',
    title: 'Archaeology',
    text: 'Survey and excavation dives on ancient shipwrecks, with Akdeniz University.',
    tone: 'mint',
    projects: [
      {
        name: 'Eastern Mediterranean Amphoras',
        slug: 'eastern-mediterranean-amphoras',
        note: 'Adrasan, Kumluca and Fethiye, 2025',
      },
    ],
  },
];

/**
 * What Nev brings to a project: competences first, credentials as a short line under them
 * (only certifications Nev holds: no GUE Documentation, Scientific Diver or Cave Survey, which
 * he knows but doesn't hold). Depth (120 m) and decompression (3+ h) confirmed by Nev, 2026-11-13.
 */
export const capabilities: { title: string; text: string; credentials?: string }[] = [
  {
    title: 'Extended range diving',
    text: 'Mixed-gas dives to 120 m with 3+ hours of decompression. Closed-circuit rebreathers and DPVs extend the range and the time on site, in open water and in caves.',
    credentials: 'GUE CCR 2 · Cave 2 · DPV 1',
  },
  {
    title: 'Photogrammetry',
    text: 'Systematic underwater image capture for measurable 3D models of wrecks, sites and objects.',
    credentials: 'GUE Photogrammetry Diver',
  },
  {
    title: 'Underwater photography',
    text: 'Photographs of sites, finds and fieldwork for the project record, taken as a working member of the dive team.',
  },
  {
    title: 'Survey & documentation',
    text: 'Site and cave survey data, cave maps and find inventories, so that every dive leaves a usable record.',
  },
];

/** "Who I work with" on the résumé */
export const workWith =
  'I work with explorers and project divers, and with archaeology, photogrammetry and documentation teams. If your project needs a technical or rebreather diver who documents what they see, write to me.';

/**
 * Projects in planning. Empty until Nev shares them; the page shows the section only when there
 * is something in it.
 */
export const upcomingProjects: { name: string; text: string; when?: string }[] = [];
