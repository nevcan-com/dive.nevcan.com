/**
 * Google Analytics 4, with consent.
 *
 * GA account "nevcan.com" (its own account: account data sharing all off), property
 * "dive.nevcan.com": retention 14 months, reset on new activity off, Google signals off,
 * user-provided data off, ads personalization off in all regions, DPA accepted.
 *
 * Consent Mode Basic: gtag.js is not loaded at all until the visitor accepts.
 */
export const ANALYTICS = {
  /**
   * The release switch. While false, the production build has no banner, no "Cookie settings"
   * link and the privacy page keeps saying "No cookies". `astro dev` always shows the new state.
   * Turn on only together with `transferBasis` below.
   */
  live: false,
  /**
   * The KVKK Art. 9 basis for transferring analytics data abroad, as it is to appear on the
   * privacy page ("...on the basis of <this>."). The build fails while `live` is on and this is
   * null. Consent, with the risks stated (Google offers no KVKK standard contract); the banner
   * says the same in short.
   */
  transferBasis:
    'your explicit consent to this transfer (KVKK Art. 9(6)(a)), which you give by choosing "Accept" after being told the risks: the Personal Data Protection Board has not decided that the US provides adequate protection, no standard contract approved by the Board is in place with Google, and US authorities may be able to access the data under US law. For visitors in the EU: the EU Standard Contractual Clauses in Google\'s data processing terms (GDPR Art. 46(2)(c))' as
      string | null,
  measurementId: 'G-1Y07CYM6NB',
  /** gtag loads only here: localhost and preview builds never send anything */
  host: 'dive.nevcan.com',
  /**
   * Cookies are named dive_ga / dive_ga_… and kept to this host. Without the prefix they would
   * be _ga, the same name www.nevcan.com may set for all of .nevcan.com: the two sites would
   * share a visitor ID, and withdrawing consent here could not remove the shared cookie.
   */
  cookiePrefix: 'dive',
  /** the visitor's choice, in localStorage */
  storageKey: 'dive-consent',
  /** after this the visitor is asked again */
  choiceMonths: 12,
} as const;

/** whether the consent banner, the footer link and the analytics privacy text are on */
export const analyticsOn = ANALYTICS.live || import.meta.env.DEV;

if (ANALYTICS.live && !ANALYTICS.transferBasis)
  throw new Error('analytics.ts: live is on but transferBasis is still empty ');
