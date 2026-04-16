import { defineEventHandler, setResponseHeader } from "h3";

import { buildCsp, resolveCspEnvironment } from "../../app/core/security/csp";

/**
 * Emits the Content-Security-Policy response header in dev and staging.
 *
 * Production serves the CSP from the CloudFront custom response headers
 * policy (see auraxis-platform/infra/web/main.tf) and therefore must NOT
 * get a duplicate from Nitro. `buildCsp()` returns `null` for production,
 * which short-circuits the header write.
 *
 * Running as an HTTP header (rather than `<meta http-equiv>`) is required
 * so directives such as `frame-ancestors` are actually enforced — browsers
 * ignore frame-ancestors when delivered via meta.
 */
export default defineEventHandler((event) => {
  const env = resolveCspEnvironment(
    process.env.NUXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  );
  const policy = buildCsp(env);
  if (!policy) {
    return;
  }

  const reportUri = process.env.NUXT_PUBLIC_CSP_REPORT_URI;
  const finalPolicy = reportUri ? `${policy}; report-uri ${reportUri}` : policy;

  setResponseHeader(event, "Content-Security-Policy", finalPolicy);
});
