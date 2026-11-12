import type { Strings } from '@/i18n/en';

export type NavKey = keyof Strings['nav'];

export interface NavItem {
  key: NavKey;
  /** Homepage anchor. Detail pages (/about, /education …) replace these in Milestone 2. */
  href: string;
}

export const navItems: NavItem[] = [
  { key: 'about', href: '/#about' },
  { key: 'education', href: '/#education' },
  { key: 'conservation', href: '/#conservation' },
  { key: 'exploration', href: '/#exploration' },
  { key: 'research', href: '/#research' },
  { key: 'community', href: '/#community' },
  { key: 'contact', href: '/#contact' },
  { key: 'booking', href: '/booking' },
];
