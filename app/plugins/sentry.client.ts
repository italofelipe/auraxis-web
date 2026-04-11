import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/nuxt";
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

/** Sentinel used by Sentry's own data scrubber for redacted values. */
const REDACTED_PLACEHOLDER = "[Filtered]";

/** Keys in `event.extra` that frequently carry request payloads. */
const SENSITIVE_EXTRA_KEYS = new Set(["body", "request", "payload", "form"]);

/**
 * URL path fragments whose request bodies must never reach Sentry.
 *
 * The match is path-based (case-insensitive, substring) so it covers both
 * absolute URLs (`https://api/.../auth/login`) and relative paths
 * (`/auth/login`). Matches any sub-route (e.g. `/payments/webhooks`).
 */
const SENSITIVE_URL_FRAGMENTS = ["/auth/", "/payments", "/subscriptions"];

/**
 * Returns true if the URL path matches any route whose body carries secrets
 * (credentials, card data, billing payloads).
 *
 * @param url - URL or path from request/breadcrumb context.
 * @returns Whether the URL points at a sensitive route.
 */
export function isSensitiveUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  return SENSITIVE_URL_FRAGMENTS.some((fragment) => lower.includes(fragment));
}

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
 * Redacts breadcrumb payloads when their URL targets a sensitive route.
 * Preserves unrelated breadcrumbs untouched.
 *
 * @param breadcrumbs - Breadcrumb list from the Sentry event.
 * @returns Breadcrumb list with sensitive bodies replaced by the sentinel.
 */
function scrubBreadcrumbs(
  breadcrumbs: Breadcrumb[] | undefined,
): Breadcrumb[] | undefined {
  if (!breadcrumbs) {
    return breadcrumbs;
  }
  return breadcrumbs.map((crumb) => {
    const data = crumb.data as Record<string, unknown> | undefined;
    const url = typeof data?.url === "string" ? data.url : undefined;
    if (!isSensitiveUrl(url)) {
      return crumb;
    }
    return {
      ...crumb,
      data: {
        ...data,
        request_body: REDACTED_PLACEHOLDER,
      },
    };
  });
}

/**
 * Redacts well-known request-payload keys in `event.extra` when the event
 * was captured against a sensitive route.
 *
 * @param extra - Sentry event extra bag.
 * @returns Extra bag with sensitive keys replaced by the sentinel.
 */
function scrubExtra(
  extra: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!extra) {
    return extra;
  }
  const next: Record<string, unknown> = { ...extra };
  for (const key of Object.keys(next)) {
    if (SENSITIVE_EXTRA_KEYS.has(key)) {
      next[key] = REDACTED_PLACEHOLDER;
    }
  }
  return next;
}

/**
 * Strips personally identifiable information from a Sentry event before it is
 * transmitted to Sentry servers.
 *
 * Redacts:
 * - `user` object (keeps only the opaque `id`, drops email/username/ip)
 * - `request.cookies` (session tokens)
 * - `request.headers.authorization` and `request.headers.cookie`
 * - `request.data` on sensitive routes (auth, payments, subscriptions)
 * - `event.extra.{body,request,payload,form}` on sensitive routes
 * - Breadcrumb `request_body` on sensitive routes
 *
 * @param event - Sentry error event to sanitize.
 * @param _hint - Event hint (unused but required by the interface).
 * @returns Sanitized event ready for transmission.
 */
export function scrubPiiFromEvent(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  const user = event.user ? { id: event.user.id } : undefined;

  const sensitiveRoute = isSensitiveUrl(event.request?.url);

  const request = event.request
    ? {
        ...event.request,
        cookies: undefined,
        headers: event.request.headers
          ? redactHeaders(event.request.headers as Record<string, string>)
          : undefined,
        data: sensitiveRoute ? REDACTED_PLACEHOLDER : event.request.data,
      }
    : undefined;

  const extra = sensitiveRoute
    ? scrubExtra(event.extra as Record<string, unknown> | undefined)
    : event.extra;

  const breadcrumbs = scrubBreadcrumbs(event.breadcrumbs);

  return { ...event, user, request, extra, breadcrumbs };
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
