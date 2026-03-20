import { describe, expect, it, beforeEach } from "vitest";
import { useAuthRedirectContext } from "./useAuthRedirectContext";

describe("useAuthRedirectContext", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("saves and consumes a redirect path", () => {
    const ctx = useAuthRedirectContext();
    ctx.saveRedirect("/goals");
    expect(ctx.consumeRedirect()).toBe("/goals");
  });

  it("clears the saved path after consuming", () => {
    const ctx = useAuthRedirectContext();
    ctx.saveRedirect("/wallet");
    ctx.consumeRedirect();
    expect(ctx.peekRedirect()).toBeNull();
  });

  it("returns fallback path when nothing is saved", () => {
    const ctx = useAuthRedirectContext();
    expect(ctx.consumeRedirect()).toBe("/dashboard");
  });

  it("normalizes paths not starting with / to fallback", () => {
    const ctx = useAuthRedirectContext();
    ctx.saveRedirect("evil.com/steal");
    expect(ctx.consumeRedirect()).toBe("/dashboard");
  });

  it("peekRedirect reads without clearing", () => {
    const ctx = useAuthRedirectContext();
    ctx.saveRedirect("/transactions");
    expect(ctx.peekRedirect()).toBe("/transactions");
    expect(ctx.peekRedirect()).toBe("/transactions"); // still there
  });

  it("clearRedirect removes stored value", () => {
    const ctx = useAuthRedirectContext();
    ctx.saveRedirect("/dashboard");
    ctx.clearRedirect();
    expect(ctx.peekRedirect()).toBeNull();
  });

  it("stores valid absolute paths as-is", () => {
    const ctx = useAuthRedirectContext();
    ctx.saveRedirect("/features/tools/simulator");
    expect(ctx.consumeRedirect()).toBe("/features/tools/simulator");
  });
});
