import type { ErrorEvent, EventHint } from "@sentry/nuxt";
import * as Sentry from "@sentry/nuxt";

/**
 * Normalizes the DSN: returns the trimmed string or empty string if absent.
 *
 * @param raw - Raw DSN value from runtimeConfig.
 * @returns Normalized DSN.
 */
export function normalizeDsn(raw: unknown): string {
  return String(raw ?? "").trim();
}

/** HTTP header names that carry credentials and must be stripped. */
const REDACTED_HEADERS = new Set(["authorization", "cookie"]);

/**
 * Returns a copy of the header map with credential headers removed.
 *
 * @param headers - Original header map from the Sentry request context.
 * @returns Header map without credential headers.
 */
const redactHeaders = (
  headers: Record<string, string>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers).filter(([key]) => !REDACTED_HEADERS.has(key.toLowerCase())),
  );

/**
 * Strips personally identifiable information from a Sentry event before it is
 * transmitted to Sentry servers.
 *
 * Redacts:
 * - `user` object (keeps only the opaque `id`, drops email/username/ip)
 * - `request.cookies` (session tokens)
 * - `request.headers.authorization` and `request.headers.cookie`
 *
 * @param event - Sentry error event to sanitize.
 * @param _hint - Event hint (unused but required by the interface).
 * @returns Sanitized event ready for transmission.
 */
export function scrubPiiFromEvent(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  const user = event.user ? { id: event.user.id } : undefined;

  const request = event.request
    ? {
        ...event.request,
        cookies: undefined,
        headers: event.request.headers
          ? redactHeaders(event.request.headers as Record<string, string>)
          : undefined,
      }
    : undefined;

  return { ...event, user, request };
}

/**
 * Initializes Sentry with the DSN and environment.
 * Exported separately to simplify unit testing.
 *
 * @param dsn - Sentry project Data Source Name.
 * @param environment - Execution environment (production, staging, development).
 */
export function initSentry(dsn: string, environment: string): void {
  Sentry.init({
    dsn,
    environment,
    enabled: true,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend: scrubPiiFromEvent,
  });
}

/**
 * Nuxt plugin for Sentry initialization on the client.
 * Keeps the plugin inert when the DSN is not configured (opt-in).
 * Vue integration is managed automatically by @sentry/nuxt/module.
 *
 * Note: the plugin body relies on Nuxt runtime (useRuntimeConfig / defineNuxtPlugin)
 * and is excluded from unit-test coverage — covered by e2e/integration tests.
 */
/* v8 ignore start */
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const dsn = normalizeDsn(runtimeConfig.public.sentryDsn);

  if (!dsn) {
    return;
  }

  const environment = normalizeDsn(runtimeConfig.public.appEnv) || "production";
  initSentry(dsn, environment);
});
/* v8 ignore stop */
