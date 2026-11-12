/**
 * Cookie consent: the stored choice, and Google Analytics started only after "Accept".
 * Consent Mode Basic: before consent no Google script or request at all.
 */
import { ANALYTICS } from '@/data/analytics';

export interface Choice {
  analytics: boolean;
  /** when the choice was made (ms) */
  at: number;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MAX_AGE = ANALYTICS.choiceMonths * 30.44 * 24 * 60 * 60 * 1000;
const DISABLE_FLAG = `ga-disable-${ANALYTICS.measurementId}`;

/** when storage is blocked, the choice still holds for this page */
let memory: Choice | null = null;

export function readChoice(): Choice | null {
  try {
    const raw = localStorage.getItem(ANALYTICS.storageKey);
    if (raw) {
      const c = JSON.parse(raw) as Partial<Choice>;
      if (typeof c.analytics === 'boolean' && typeof c.at === 'number') {
        if (Date.now() - c.at < MAX_AGE) return c as Choice;
        localStorage.removeItem(ANALYTICS.storageKey);
      }
    }
  } catch {
    /* private mode, blocked storage, bad JSON: ask again */
  }
  return memory;
}

export function saveChoice(analytics: boolean): Choice {
  const c = { analytics, at: Date.now() };
  memory = c;
  try {
    localStorage.setItem(ANALYTICS.storageKey, JSON.stringify(c));
  } catch {
    /* kept in memory for this page only */
  }
  return c;
}

/** apply a choice: start analytics, or stop it and remove its cookies */
export function applyChoice(c: Choice | null) {
  if (c?.analytics) startAnalytics();
  else stopAnalytics();
}

let loaded = false;

function startAnalytics() {
  const w = window as unknown as Record<string, unknown>;
  if (loaded) {
    // accepted again after withdrawing on the same page
    w[DISABLE_FLAG] = false;
    window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  if (location.hostname !== ANALYTICS.host) {
    if (import.meta.env.DEV)
      console.info(`[analytics] consent given; GA4 loads only on ${ANALYTICS.host}`);
    return;
  }
  loaded = true;
  w[DISABLE_FLAG] = false;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the `arguments` object itself, not an array
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  // Before 'js': the property's Google tag (it runs its own config for the stream and ignores a
  // duplicate gtag config call) only picks these up from 'set', and only when they come first.
  // Passed in 'config' or after 'js', the cookies end up as _ga on .nevcan.com (tested 2026-11-12).
  window.gtag('set', {
    cookie_domain: ANALYTICS.host,
    cookie_prefix: ANALYTICS.cookiePrefix,
    // also off in the GA property; here so a later change there cannot turn them on
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS.measurementId);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.measurementId}`;
  document.head.append(s);
}

function stopAnalytics() {
  if (loaded) {
    (window as unknown as Record<string, unknown>)[DISABLE_FLAG] = true;
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  }
  clearCookies();
}

/** removes this site's analytics cookies (dive_ga, dive_ga_…), never another site's _ga */
function clearCookies() {
  const prefix = `${ANALYTICS.cookiePrefix}_ga`;
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((n) => n === prefix || n.startsWith(`${prefix}_`));
  for (const name of names)
    for (const domain of ['', location.hostname, `.${location.hostname}`])
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
}
