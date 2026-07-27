import { describe, expect, it } from "vitest";

import {
  createIdempotencyKey,
  idempotencyHeaders,
  IDEMPOTENCY_KEY_HEADER,
} from "./idempotency";

describe("createIdempotencyKey", () => {
  it("prefixes the key with the calling scope so charges are traceable in API logs", () => {
    expect(createIdempotencyKey("landing-checkout")).toMatch(
      /^landing-checkout-[0-9a-f-]{36}$/,
    );
  });

  it("never repeats a key across intents", () => {
    const keys = new Set(
      Array.from({ length: 50 }, () => createIdempotencyKey("checkout")),
    );

    expect(keys.size).toBe(50);
  });
});

describe("idempotencyHeaders", () => {
  it("returns the header name the API middleware expects", () => {
    const headers = idempotencyHeaders("checkout");

    expect(Object.keys(headers)).toEqual([IDEMPOTENCY_KEY_HEADER]);
    expect(headers[IDEMPOTENCY_KEY_HEADER]).toMatch(/^checkout-/);
  });
});
