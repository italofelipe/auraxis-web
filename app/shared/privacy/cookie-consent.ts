export const COOKIE_CONSENT_KEY = "auraxis_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_EVENT = "auraxis:cookie-consent-changed";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export interface CookieConsentPreferences {
  version: typeof COOKIE_CONSENT_VERSION;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}

export interface CookieConsentInput {
  necessary?: boolean;
  analytics?: boolean;
  marketing?: boolean;
}

export type CookieConsentSubscriber = (preferences: CookieConsentPreferences) => void;

/** @returns Whether the current runtime exposes browser cookie APIs. */
const isBrowser = (): boolean => typeof document !== "undefined";

/**
 * Reads a raw cookie value by key.
 *
 * @param key Cookie name to read.
 * @returns Encoded cookie value or null when absent.
 */
const readCookieValue = (key: string): string | null => {
  if (!isBrowser()) {
    return null;
  }

  const prefix = `${key}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!entry) {
    return null;
  }

  return entry.slice(prefix.length);
};

/**
 * Checks whether an unknown value can be safely indexed.
 *
 * @param value Unknown value to inspect.
 * @returns True when the value is a non-null object record.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Parses the persisted consent payload.
 *
 * @param raw Encoded JSON cookie value.
 * @returns Normalized consent preferences or null for invalid payloads.
 */
const parseCookieConsent = (raw: string): CookieConsentPreferences | null => {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));

    if (!isRecord(parsed) || parsed.version !== COOKIE_CONSENT_VERSION) {
      return null;
    }

    return {
      version: COOKIE_CONSENT_VERSION,
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
};

/**
 * Notifies browser listeners that consent preferences changed.
 *
 * @param preferences Latest saved preferences.
 */
const dispatchCookieConsentChanged = (preferences: CookieConsentPreferences): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<CookieConsentPreferences>(
    COOKIE_CONSENT_EVENT,
    { detail: preferences },
  ));
};

/**
 * Persists preferences in a first-party necessary cookie.
 *
 * @param preferences Normalized preferences to store.
 */
const writeConsentCookie = (preferences: CookieConsentPreferences): void => {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = encodeURIComponent(JSON.stringify(preferences));
  document.cookie = [
    `${COOKIE_CONSENT_KEY}=${value}`,
    "path=/",
    `max-age=${COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
    secure,
  ].filter(Boolean).join("; ");
};

/**
 * Normalizes partial visitor choices into the versioned cookie payload.
 *
 * @param preferences Visitor-selected optional categories.
 * @param now Timestamp used for auditability.
 * @returns Versioned cookie consent preferences.
 */
export const normalizeCookieConsent = (
  preferences: CookieConsentInput,
  now: Date = new Date(),
): CookieConsentPreferences => ({
  version: COOKIE_CONSENT_VERSION,
  necessary: true,
  analytics: preferences.analytics === true,
  marketing: preferences.marketing === true,
  updatedAt: now.toISOString(),
});

/**
 * Reads consent preferences from the browser cookie jar.
 *
 * @returns Saved preferences or null when no valid choice exists.
 */
export const readCookieConsent = (): CookieConsentPreferences | null => {
  const raw = readCookieValue(COOKIE_CONSENT_KEY);
  return raw ? parseCookieConsent(raw) : null;
};

/**
 * Checks if analytics and performance cookies are allowed.
 *
 * @param preferences Optional preferences snapshot. Reads from cookies by default.
 * @returns Whether analytics cookies may be used.
 */
export const canUseAnalyticsCookies = (
  preferences: CookieConsentPreferences | null = readCookieConsent(),
): boolean => preferences?.analytics === true;

/**
 * Checks if marketing cookies are allowed.
 *
 * @param preferences Optional preferences snapshot. Reads from cookies by default.
 * @returns Whether marketing cookies may be used.
 */
export const canUseMarketingCookies = (
  preferences: CookieConsentPreferences | null = readCookieConsent(),
): boolean => preferences?.marketing === true;

/**
 * Saves granular consent preferences and emits a browser change event.
 *
 * @param preferences Visitor-selected optional categories.
 * @param now Timestamp used for auditability.
 * @returns Saved normalized preferences.
 */
export const saveCookieConsent = (
  preferences: CookieConsentInput,
  now: Date = new Date(),
): CookieConsentPreferences => {
  const normalized = normalizeCookieConsent(preferences, now);
  writeConsentCookie(normalized);
  dispatchCookieConsentChanged(normalized);
  return normalized;
};

/**
 * Saves consent with every optional category enabled.
 *
 * @param now Timestamp used for auditability.
 * @returns Saved normalized preferences.
 */
export const acceptAllCookieConsent = (now: Date = new Date()): CookieConsentPreferences =>
  saveCookieConsent({ analytics: true, marketing: true }, now);

/**
 * Saves consent with every optional category disabled.
 *
 * @param now Timestamp used for auditability.
 * @returns Saved normalized preferences.
 */
export const rejectOptionalCookieConsent = (now: Date = new Date()): CookieConsentPreferences =>
  saveCookieConsent({ analytics: false, marketing: false }, now);

/**
 * Subscribes to browser consent-change events.
 *
 * @param subscriber Callback invoked with the latest saved preferences.
 * @returns Unsubscribe function.
 */
export const subscribeToCookieConsentChanges = (
  subscriber: CookieConsentSubscriber,
): (() => void) => {
  if (typeof window === "undefined") {
    return (): void => { /* noop */ };
  }

  /**
   * Forwards valid CustomEvent payloads to the typed subscriber.
   *
   * @param event Browser consent-change event.
   */
  const listener = (event: Event): void => {
    const detail = (event as CustomEvent<CookieConsentPreferences>).detail;
    if (detail) {
      subscriber(detail);
    }
  };

  window.addEventListener(COOKIE_CONSENT_EVENT, listener);
  return (): void => window.removeEventListener(COOKIE_CONSENT_EVENT, listener);
};
