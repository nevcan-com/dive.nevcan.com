/**
 * Nev's own accounts, as linked from nevcan.com (checked 2026-11-11; Facebook given by Nev). Club and brand accounts
 * (GUE Türkiye, SUEX) are not listed here. Also published as JSON-LD `sameAs` on the homepage.
 */
export interface SocialLink {
  id: 'instagram' | 'facebook' | 'youtube' | 'linkedin' | 'medium' | 'sketchfab';
  label: string;
  href: string;
}

export const social: SocialLink[] = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/nevcanuludas/' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/nevcanuludas/' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/nevcanuludas' },
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/nevcanuludas' },
  { id: 'medium', label: 'Medium', href: 'https://medium.com/neptunsualti' },
  { id: 'sketchfab', label: 'Sketchfab', href: 'https://sketchfab.com/nevcanuludas' },
];

/** primary contact; same number as on nevcan.com */
export const whatsapp = {
  label: 'WhatsApp',
  href: `https://wa.me/905555435144?text=${encodeURIComponent('Hello 👋')}`,
};
