/**
 * The About page (/about). Every fact here comes from Nev's own pages, read 2026-11-11: his GUE
 * instructor résumé (gue.com, instructor id 20397), nevcan.com, and his LinkedIn experience
 * (pasted by Nev).
 * Don't add anything that isn't confirmed by Nev; open items are listed at the bottom.
 */

export const GUE_RESUME =
  'https://gue.com/diver-training/gue-instructors/instructor-resume?id=20397';
export const GUE_SCHEDULE = 'https://gue.com/diver-training/gue-class-schedule?InstructorID=20397';

/** nevcan.com, "Hello, I'm Nevcan" (lightly tightened, same facts) */
export const intro = [
  'My diving journey started in 2008, with my first breath underwater at my university’s diving club. Back at the surface I said: “I will become an instructor too.” Three years later, I was one.',
  'Following that path, I became the first GUE instructor in Türkiye, which drew me into education programmes for ocean conservation and into underwater exploration projects around the world.',
  'Besides teaching, I’m drawn to freediving, technical deep diving, mixed gases and closed-circuit rebreathers, and most of all, to caves.',
];

export const stats = [
  { value: '7000+', label: 'Total dives' },
  { value: '1000+', label: 'Wreck dives' },
  { value: '200+', label: 'Trimix dives' },
  { value: '100+', label: 'Rebreather dives' },
  { value: '50+', label: 'Cave dives' },
];

/** the "What I do" cards, in display order (`since` for current roles, `when` for past ones) */
export const roles: {
  title: string;
  where: string;
  href?: string;
  note?: string;
  since?: string;
  when?: string;
}[] = [
  {
    title: 'Instructor Trainer',
    where: 'Global Underwater Explorers',
    since: 'since 2026',
    href: GUE_RESUME,
  },
  {
    title: 'Founder / Regional Director',
    where: 'GUE TR',
    since: 'since 2018',
    href: 'https://gue.com.tr',
  },
  { title: 'Co-founder & CTPO', where: 'Dipnot', since: 'since 2025', href: 'https://dipnot.app' },
  {
    title: 'Scuba Instructor / Safety Supervisor',
    where: 'Deep Dive Dubai',
    href: 'https://www.deepdivedubai.com/',
    note: 'the world’s deepest pool',
    when: '2022–2024',
  },
  {
    title: 'Owner / Instructor',
    where: 'Neptün Sualtı Merkezi',
    href: 'https://neptunsualti.com/',
    note: 'Istanbul, TR',
    since: 'since 2014',
  },
];

/** Neptün Sualtı Merkezi (LinkedIn) */
export const neptun = {
  text: 'My own dive centre in Istanbul, since 2014: theory and practice in every branch of diving, with a team of specialist instructors. For deaf and hard-of-hearing divers, classes run with Turkish Sign Language instructors.',
  branches: [
    'Scuba, all levels',
    '23 specialty dives',
    'Freediving',
    'Technical diving',
    'Adaptive diving, all levels',
    'Instructor training',
  ],
};

/** the other half: software (LinkedIn) */
export const software = {
  text: 'Twenty years in software. Today it runs Dipnot App and data-driven explorations.',
  steps: [
    { when: '2006–2016', what: 'Full-stack developer, freelance (140+ websites)' },
    {
      when: '2010–2014',
      what: 'Software developer and project manager (Tilcomp, Eczane Sanem, Online İşler)',
    },
    { when: '2015–2017', what: 'Front-end developer, D&R (dr.com.tr, idefix)' },
    { when: '2017–2019', what: 'Front-end architect, Doğuş Teknoloji' },
    { when: '2019–2021', what: 'Front-end architect, SabancıDx' },
  ],
};

export const education = [
  {
    degree: 'MA, Mediterranean Underwater Cultural Heritage Research',
    school: 'Akdeniz University',
    year: '2025–2027',
  },
  {
    degree: 'BSc, Mining Engineering',
    school: 'Eskişehir Osmangazi University',
    year: '2005–2010',
    note: 'Diving club: OGÜSEA, where it all started',
  },
];

/** LinkedIn: Turkish native, English professional working proficiency */
export const languages = [
  { name: 'Turkish', code: 'TR', level: 'Native', dots: 5 },
  { name: 'English', code: 'EN', level: 'Professional', dots: 4 },
];

/** member instructor of (LinkedIn "Organizations") */
export const memberships = [
  { org: 'GUE', since: '2022' },
  { org: 'SSI', since: '2021' },
  { org: 'ProTec', since: '2015' },
  { org: 'TSSF', since: '2011' },
];

/** for the Education detail page (not shown on /about) */
export const teaches = {
  languages: ['English', 'Turkish'],
  classes: [
    'Discover Diving',
    'Scuba Diver',
    'Open Water Diver',
    'Advanced Open Water Diver',
    'Master Diver',
    'GUE Performance Diver',
    'GUE Basic Fundamentals',
    'GUE Technical Fundamentals',
    'Doubles Primer',
    'Drysuit Primer',
    'Navigation Primer',
    'Rescue Primer',
    'Deep Primer',
    'DPV Diver 1',
    'Gas Blender',
  ],
};

/**
 * Nev's GUE instructor cards, newest first (GUE renews them every season). Images: the card's two
 * halves from source-media/gue-cards/, as public/media/gue-cards/<season>-front|back.webp. The
 * front carries the details, the back GUE's photo (its photographer is printed on the card).
 * A new season: add the PNG to source-media/gue-cards/, split it (see CREDITS.md) and add a row on top.
 */
export const gueCards = [
  {
    season: '2026–2027',
    slug: '2026-27',
    rating: 'Instructor Trainer',
    expires: 'September 2027',
    photo: 'JP Bresser',
  },
  {
    season: '2025–2026',
    slug: '2025-26',
    rating: 'Instructor',
    expires: 'September 2026',
    photo: 'L. Mirault',
  },
  {
    season: '2024–2025',
    slug: '2024-25',
    rating: 'Instructor',
    expires: 'September 2025',
    photo: 'J. Mühlenhaus',
  },
  {
    season: '2023–2024',
    slug: '2023-24',
    rating: 'Instructor',
    expires: 'September 2024',
    photo: 'J. Mühlenhaus',
  },
];

/** GUE instructor ratings are on the GUE card (GueCard) and the courses go on Education */
export const qualifications = [
  {
    group: 'GUE Diver',
    items: ['Technical 1', 'CCR 1 & 2', 'Cave 1 & 2', 'Photogrammetry'],
  },
  {
    group: 'Rebreathers',
    items: [
      'JJ-CCR (original and GUE configuration)',
      'Halcyon Symbios (chest-mount)',
      'SF2 eCCR',
      'Poseidon MKVI / Se7en',
    ],
  },
  {
    group: 'Instructor, other agencies',
    items: [
      'TSSF / CMAS 2★ Instructor (2015)',
      'ProTec 2★ Instructor (2015)',
      'SSI Professional, Open Water Instructor (2021)',
      'Adaptive Diving Instructor',
    ],
  },
  {
    group: 'Diver, other agencies',
    items: [
      'TSSF Guide Diver (2012)',
      'TDI Advanced Trimix Diver (2021)',
      'AIDA 3 Freediver (2022)',
      'ILS / TSSF Gold Lifeguard (2011)',
    ],
  },
];

/** for the Exploration detail page (not shown on /about) */
export const research = [
  { site: 'Plate Shipwreck', place: 'Adrasan, Antalya', year: '2025' },
  { site: 'Kumluca Shipwreck', place: 'Finike, Antalya', year: '2025' },
  { site: 'Two newly discovered shipwrecks', place: 'Fethiye, Muğla', year: '2025' },
];

/** for the Community / projects pages (not shown on /about) */
export const community = [
  { role: 'Project Manager', what: 'KarstDive 25', href: 'https://gue.com.tr/karstdive25/' },
  {
    role: 'Project Diver',
    what: 'Project Baseline: Marmara',
    href: 'https://gueturkey.com/pb-marmara/',
  },
  { role: 'Coordinator', what: 'Ghost Diving Türkiye' },
  { role: 'Member', what: 'GUE UAE · TSSF · Emirates Diving Association' },
  { role: 'Dry caver', what: 'ASPEG speleology team', href: 'https://aspeg.org.tr' },
];

export const ambassador = ['Halcyon', 'SUEX', 'Shearwater', 'Big Blue Dive Lights'];

export const publications = [
  {
    title: 'Doubles Set Up (Turkish, EN/TR subtitles)',
    where: 'GUE.tv',
    href: 'https://gue.tv/programs/doubles-set-up-turkish?via=nev',
  },
  { title: 'GUE Gas Blender, content developer', where: 'GUE', year: '2025' },
];

export const interests = [
  'Human factors',
  'Conservation of underwater environments',
  'Underwater cultural heritage',
  'Cave survey and cave maps',
  '3D photogrammetry',
  'FPV drones',
  'ROVs',
];

/*
 * Open items (ask Nev before adding):
 * - master's thesis (topic known, not on the page yet): "Typological Analysis of Mediterranean
 *   Amphorae Using Artificial Intelligence" (TR: Akdeniz Amforalarının Yapay Zeka ile Tipolojik
 *   Analizi); degree, university and year still to ask
 * (freediving / Ironman PBs get a page of their own elsewhere, not on dive.nevcan.com)
 */
