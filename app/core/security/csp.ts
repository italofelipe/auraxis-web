/**
 * Content Security Policy builder for the Auraxis web app.
 *
 * Emits an env-aware CSP string that is baked into a `<meta http-equiv>` tag
 * at SSG time by `nuxt.config.ts`. In production the CSP is emitted by a
 * custom CloudFront response headers policy (see
 * `auraxis-platform/infra/web/main.tf` → `aws_cloudfront_response_headers_policy.web_security`),
 * so this module returns `null` for `"production"` and no meta tag is
 * injected.
 *
 * `PRODUCTION_CSP` is exported as the canonical source of truth for the
 * production policy — the terraform module must stay in sync with it (SEC-2).
 *
 * Kept dependency-free so `nuxt.config.ts` can import it at build time and
 * Vitest can cover it without Nuxt runtime.
 */

/**
 * Execution environments that drive the CSP shape.
 *
 * - `development`: permissive — allows `unsafe-inline`/`unsafe-eval`, `ws:`
 *   for HMR and `http://localhost:*` so Vite dev server works.
 * - `staging`: production-equivalent — no inline scripts, only `self` + API
 *   + Sentry ingest, surfacing any real CSP regression before prod.
 * - `production`: returns `null` here — CloudFront emits the CSP header via
 *   the custom response headers policy documented in
 *   `auraxis-platform/infra/web/main.tf`.
 */
export type CspEnvironment = "development" | "staging" | "production";

const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' ws: wss: http://localhost:* https://api.auraxis.com.br https://brapi.dev https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const STAGING_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.auraxis.com.br https://brapi.dev https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

/**
 * Canonical production CSP value.
 *
 * Byte-identical to the CSP currently served by CloudFront distribution
 * E38WVQOCDQADWB (custom response headers policy
 * `8078897a-1312-4e87-8730-4c959789ecde`), and to `local.web_csp` in
 * `auraxis-platform/infra/web/main.tf`. If you change one, change all three.
 *
 * This constant is exported so integration tests can assert the sources
 * stay in sync.
 */
export const PRODUCTION_CSP = [
  "default-src 'self'",
  // SEC-AUD-01 (partial) — 'unsafe-eval' removed; Vue/Vite production
  // bundles don't require eval. 'unsafe-inline' remains temporarily
  // because Naive UI's @css-render/vue3-ssr emits inline <style> blocks;
  // tracked by the follow-up issue for hash-based CSP migration.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.auraxis.com.br https://brapi.dev https://*.sentry.io https://*.posthog.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/**
 * Normalises an arbitrary runtime string into a known {@link CspEnvironment}.
 *
 * Unknown values (including `undefined`) fall back to `"development"` — the
 * most permissive policy — so local tooling never breaks when the env var is
 * missing.
 *
 * @param raw Raw value from `process.env.NUXT_PUBLIC_APP_ENV` or similar.
 * @returns Resolved execution environment.
 */
export const resolveCspEnvironment = (raw: string | undefined): CspEnvironment => {
  if (raw === "production" || raw === "prod") {
    return "production";
  }
  if (raw === "staging" || raw === "stage") {
    return "staging";
  }
  return "development";
};

/**
 * Builds the CSP string for a given environment.
 *
 * @param env Execution environment.
 * @returns CSP directive string, or `null` when the environment emits the
 *          CSP via an HTTP header (production — see
 *          `aws_cloudfront_response_headers_policy.web_security`).
 */
export const buildCsp = (env: CspEnvironment): string | null => {
  if (env === "production") {
    return null;
  }
  if (env === "staging") {
    return STAGING_CSP;
  }
  return DEV_CSP;
};
