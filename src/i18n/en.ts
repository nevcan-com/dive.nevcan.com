/** UI strings (English). Add `tr.ts` with the same shape when Turkish launches. */
export const en = {
  site: {
    /** the homepage's tab title */
    name: 'Dive with Nev',
    /** after a subpage's title: "About · Nevcan Uludaş" */
    shortName: 'Nevcan Uludaş',
    /** shared links (og/twitter) and og:site_name keep the full name */
    shareName: 'Dive with Nevcan Uludaş',
    description:
      'GUE instructor and explorer Nevcan Uludaş: diving education, underwater exploration, marine conservation and community.',
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    depthGauge: 'Current depth in the page journey',
    language: 'Language',
  },
  nav: {
    about: 'About',
    education: 'Education',
    exploration: 'Exploration',
    research: 'Research',
    conservation: 'Conservation',
    community: 'Community',
    contact: 'Contact',
    booking: 'Booking',
  },
} as const;

export type Strings = typeof en;
