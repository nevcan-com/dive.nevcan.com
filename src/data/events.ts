/**
 * Upcoming courses and trips, shown in the footer (next three) and on the booking page.
 * Only real, confirmed dates go in `upcoming`. `sampleEvents` exists for design previews
 * (/preview/*) and must never be rendered on a public page.
 */
export interface UpcomingEvent {
  title: string;
  /** ISO dates, end inclusive */
  start: string;
  end?: string;
  location: string;
  kind: 'course' | 'trip';
  /** open: places available; few: last places; full: waiting list */
  status: 'open' | 'few' | 'full';
}

export const upcoming: UpcomingEvent[] = [
  // listed as active on GUE (given by Nev, 2026-11-11); start date only, no end date needed (Nev)
  {
    title: 'ITC GUE Performance Diver',
    start: '2027-03-01',
    location: 'Istanbul',
    kind: 'course',
    status: 'open',
  },
];

export const sampleEvents: UpcomingEvent[] = [
  {
    title: 'DPV-1',
    start: '2026-12-12',
    end: '2026-12-14',
    location: 'Kaş, Antalya',
    kind: 'course',
    status: 'few',
  },
  {
    title: 'Tech. Fundamentals',
    start: '2027-01-16',
    end: '2027-01-20',
    location: 'Istanbul',
    kind: 'course',
    status: 'open',
  },
  {
    title: 'Gas Blender',
    start: '2027-02-06',
    end: '2027-02-07',
    location: 'Istanbul',
    kind: 'course',
    status: 'full',
  },
];
