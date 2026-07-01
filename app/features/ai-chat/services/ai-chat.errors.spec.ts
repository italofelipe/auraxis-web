import { describe, expect, it } from "vitest";

import { ApiError } from "~/core/errors";

import { classifyChatError } from "./ai-chat.errors";

describe("classifyChatError", () => {
  it("maps ENTITLEMENT_REQUIRED to 'entitlement'", () => {
    expect(classifyChatError(new ApiError(403, "Premium", "ENTITLEMENT_REQUIRED"))).toBe(
      "entitlement",
    );
  });

  it("maps AI_CONSENT_REQUIRED to 'consent'", () => {
    expect(classifyChatError(new ApiError(403, "Consent", "AI_CONSENT_REQUIRED"))).toBe("consent");
  });

  it("maps the budget code or a raw 429 to 'budget'", () => {
    expect(classifyChatError(new ApiError(429, "Budget", "AI_INSIGHT_BUDGET_EXCEEDED"))).toBe(
      "budget",
    );
    expect(classifyChatError(new ApiError(429, "Too many"))).toBe("budget");
  });

  it("maps a 400 to 'validation'", () => {
    expect(classifyChatError(new ApiError(400, "Invalid", "VALIDATION_ERROR"))).toBe("validation");
  });

  it("maps an unrecognized 403 to 'entitlement'", () => {
    expect(classifyChatError(new ApiError(403, "Forbidden"))).toBe("entitlement");
  });

  it("falls back to 'server' for 500s and non-error values", () => {
    expect(classifyChatError(new ApiError(500, "Boom", "INTERNAL_ERROR"))).toBe("server");
    expect(classifyChatError(new Error("network"))).toBe("server");
    expect(classifyChatError(null)).toBe("server");
    expect(classifyChatError("nope")).toBe("server");
  });
});
