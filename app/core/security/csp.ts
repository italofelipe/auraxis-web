/**
 * Content Security Policy builder for the Auraxis web app.
 *
 * Emits an env-aware CSP string that is baked into a `<meta http-equiv>` tag
 * at SSG time by `nuxt.config.ts`. In production the CSP is set by the
 * CloudFront Response Headers Policy instead, so this module returns `null`
 * for `"production"` and the meta tag is omitted.
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
 * - `production`: returns `null` — CloudFront emits the CSP header so the
 *   meta tag is omitted to avoid double-specification.
 */
export type CspEnvironment = "development" | "staging" | "production";

const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' ws: wss: http://localhost:* https://api.auraxis.com.br https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join("; ");

const STAGING_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://api.auraxis.com.br https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
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
 *          CSP via an HTTP header (production).
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
