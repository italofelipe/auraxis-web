/**
 * Observability bootstrap.
 *
 * Central point for error tracking and performance monitoring.
 * Sentry is initialised via `@sentry/nuxt` plugin — this module
 * exposes thin helpers so features don't import Sentry directly.
 *
 * Usage:
 *   import { captureException } from '~/core/observability';
 *   captureException(error, { context: 'wallet.load' });
 */

export interface ObservabilityContext {
  context?: string;
  extra?: Record<string, unknown>;
}

/**
 * Captures an exception through the active error-tracking provider.
 * No-ops gracefully when Sentry is not initialised (e.g., local dev without DSN).
 *
 * @param error The error to capture.
 * @param meta Optional context metadata.
 */
export const captureException = (error: unknown, meta?: ObservabilityContext): void => {
  try {
    // Dynamic import keeps Sentry tree-shakeable in environments where it is not loaded.
    const sentry = (globalThis as Record<string, unknown>).__SENTRY__;
    if (sentry && typeof (sentry as Record<string, unknown>).captureException === "function") {
      (sentry as { captureException: (e: unknown, ctx?: unknown) => void }).captureException(
        error,
        meta ? { extra: meta } : undefined,
      );
    }
  } catch {
    // Observability must never throw — degrade silently.
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[observability]", meta?.context ?? "unknown", error);
  }
};

/**
 * Adds a breadcrumb to the current Sentry scope.
 *
 * @param message Human-readable event description.
 * @param category Event category (e.g. "auth", "navigation").
 */
export const addBreadcrumb = (message: string, category: string): void => {
  try {
    const sentry = (globalThis as Record<string, unknown>).__SENTRY__;
    if (sentry && typeof (sentry as Record<string, unknown>).addBreadcrumb === "function") {
      (sentry as { addBreadcrumb: (b: unknown) => void }).addBreadcrumb({
        message,
        category,
        level: "info",
      });
    }
  } catch {
    // Degrade silently.
  }
};
