/**
 * Idempotency keys for the POST endpoints that require them.
 *
 * The API rejects `POST /subscriptions/checkout` and `/subscriptions/cancel`
 * with 400 `IDEMPOTENCY_KEY_REQUIRED` when the `Idempotency-Key` header is
 * absent (api#946), and replays the stored response when the same key comes
 * back with the same body.
 *
 * A key stands for **one user intent**, not one request: generate it once when
 * the user submits and let the automatic retries (see `retry-config.ts`) reuse
 * it, so a checkout that is retried after a network blip settles as a single
 * charge. A new click means a new intent — and a new key.
 */

/** Header name expected by the API middleware. */
export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";

/**
 * Builds an idempotency key scoped to the flow that issues it.
 *
 * The scope prefix is only there to make keys readable in API logs when
 * tracing a charge back to the surface that started it.
 *
 * @param scope Short slug identifying the caller, e.g. `landing-checkout`.
 * @returns Key such as `landing-checkout-3f1c…`.
 */
export const createIdempotencyKey = (scope: string): string =>
  `${scope}-${globalThis.crypto.randomUUID()}`;

/**
 * Builds the request headers carrying a fresh idempotency key.
 *
 * @param scope Short slug identifying the caller.
 * @returns Headers object ready to spread into an Axios request config.
 */
export const idempotencyHeaders = (
  scope: string,
): Record<string, string> => ({
  [IDEMPOTENCY_KEY_HEADER]: createIdempotencyKey(scope),
});
