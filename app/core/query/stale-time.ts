/**
 * Canonical `staleTime` presets for Vue Query composables.
 *
 * PERF-7 (MVP1 hardening) requires every query to set `staleTime`
 * explicitly, so the cache-freshness contract of each endpoint is
 * visible at the call site instead of implicitly inherited from the
 * global QueryClient default in `app/plugins/vue-query.ts`.
 *
 * Four buckets cover the application today:
 *
 * - `REALTIME` (15 s) — high-volatility financial data the user expects
 *   to reflect nearly-live state (live portfolio value, recent wallet
 *   activity). Still cached for a short window to avoid thrashing the
 *   API if the same view is mounted repeatedly.
 *
 * - `ACTIVE` (30 s) — current user activity (transaction lists, due
 *   ranges, receivables). Matches the legacy global default, lifted to
 *   an explicit constant so changes are obvious in review.
 *
 * - `STABLE` (5 min) — derived or aggregated data that only changes when
 *   the user performs an action (budgets, goals, subscription state,
 *   sharing relationships, alerts). Refetch on mount is still enabled
 *   by Vue Query for fresh-load correctness.
 *
 * - `STATIC` (1 h) — user-owned configuration and rarely-changing
 *   metadata (tags, credit cards, accounts, profile, entitlements,
 *   alert preferences). Manual invalidation is expected when the user
 *   edits these.
 *
 * Anything shorter than `REALTIME` should use a WebSocket/SSE stream
 * instead of polling. Anything longer than `STATIC` should not be kept
 * in Vue Query at all.
 */

export const STALE_TIME = {
  /** 15 seconds — live financial data. */
  REALTIME: 15 * 1000,
  /** 30 seconds — current user activity (matches the global default). */
  ACTIVE: 30 * 1000,
  /** 5 minutes — derived/aggregated data. */
  STABLE: 5 * 60 * 1000,
  /** 1 hour — user configuration and metadata. */
  STATIC: 60 * 60 * 1000,
} as const;

export type StaleTime = (typeof STALE_TIME)[keyof typeof STALE_TIME];
