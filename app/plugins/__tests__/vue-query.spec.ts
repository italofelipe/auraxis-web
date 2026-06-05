import { describe, expect, it } from "vitest";

import { ApiError } from "~/utils/apiError";
import { shouldRetryQuery } from "~/plugins/vue-query";

describe("shouldRetryQuery", () => {
  it("nao retenta 429 (AI daily limit nao e transiente)", () => {
    expect(shouldRetryQuery(0, new ApiError(429, "limit", "AI_DAILY_LIMIT_EXCEEDED"))).toBe(false);
  });

  it("nao retenta outros 4xx (401/403/400/404)", () => {
    for (const status of [400, 401, 403, 404]) {
      expect(shouldRetryQuery(0, new ApiError(status, "client error"))).toBe(false);
    }
  });

  it("retenta 5xx ate o limite", () => {
    expect(shouldRetryQuery(0, new ApiError(503, "unavailable"))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(503, "unavailable"))).toBe(true);
    expect(shouldRetryQuery(2, new ApiError(503, "unavailable"))).toBe(false);
  });

  it("retenta erro sem status (rede) ate o limite", () => {
    expect(shouldRetryQuery(0, new Error("network"))).toBe(true);
    expect(shouldRetryQuery(2, new Error("network"))).toBe(false);
  });
});
