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
