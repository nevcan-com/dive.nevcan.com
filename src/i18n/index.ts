import { en } from './en';

const dictionaries = { en } as const;
export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = 'en';

export function t(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}
