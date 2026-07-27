import { describe, expect, it, vi } from "vitest";

import {
  buildLandingCheckoutPath,
  LANDING_CHECKOUT_PLANS,
  resolveLandingCheckoutPlan,
  resolveLandingCheckoutPlanFromSources,
  startLandingCheckout,
  type LandingCheckoutDeps,
} from "./landing-checkout";

describe("resolveLandingCheckoutPlan", () => {
  it("resolves the pt-BR query slugs", () => {
    expect(resolveLandingCheckoutPlan("mensal")).toBe("monthly");
    expect(resolveLandingCheckoutPlan("anual")).toBe("annual");
  });

  it("accepts the internal keys too", () => {
    expect(resolveLandingCheckoutPlan("monthly")).toBe("monthly");
  });

  it("ignores case and surrounding spaces", () => {
    expect(resolveLandingCheckoutPlan("  MENSAL ")).toBe("monthly");
  });

  it("takes the first value when the param repeats", () => {
    expect(resolveLandingCheckoutPlan(["mensal", "anual"])).toBe("monthly");
  });

  it.each([undefined, null, "", "  ", "premium", 42, {}, []])(
    "falls back to the recommended plan for %p",
    (raw) => {
      expect(resolveLandingCheckoutPlan(raw)).toBe("annual");
    },
  );
});

describe("resolveLandingCheckoutPlanFromSources", () => {
  it("reads the browser query string when the hydrated route comes back empty", () => {
    // The prerendered page hydrates with no query, and the silent fallback to
    // the recommended plan charged the annual price on a monthly link (#1203).
    expect(resolveLandingCheckoutPlanFromSources(undefined, "?plano=mensal")).toBe(
      "monthly",
    );
  });

  it("falls through to the navigation URL when route and search are both empty", () => {
    // Measured in production: at `onMounted` both are empty because Nuxt
    // strips the query while normalising the route (#1203).
    expect(
      resolveLandingCheckoutPlanFromSources(
        undefined,
        "",
        "https://auraxis.com.br/checkout?plano=mensal",
      ),
    ).toBe("monthly");
  });

  it("takes the first source that names a known plan", () => {
    expect(
      resolveLandingCheckoutPlanFromSources(
        undefined,
        "?plano=mensal",
        "https://auraxis.com.br/checkout?plano=anual",
      ),
    ).toBe("monthly");
  });

  it("survives a malformed URL source", () => {
    expect(
      resolveLandingCheckoutPlanFromSources(undefined, "://quebrado", "?plano=mensal"),
    ).toBe("monthly");
  });

  it("accepts a query string without the leading question mark", () => {
    expect(resolveLandingCheckoutPlanFromSources(undefined, "plano=mensal")).toBe(
      "monthly",
    );
  });

  it("prefers the route value over the browser query string", () => {
    expect(resolveLandingCheckoutPlanFromSources("anual", "?plano=mensal")).toBe(
      "annual",
    );
  });

  it("ignores the browser query string when it carries no known plan", () => {
    expect(
      resolveLandingCheckoutPlanFromSources(undefined, "?utm_source=x&plano=premium"),
    ).toBe("annual");
  });

  it.each([undefined, null, ""])(
    "falls back to the recommended plan when both sources are %p",
    (search) => {
      expect(resolveLandingCheckoutPlanFromSources(undefined, search)).toBe("annual");
    },
  );
});

describe("buildLandingCheckoutPath", () => {
  it("stays on the landing domain and carries the plan", () => {
    expect(buildLandingCheckoutPath("annual")).toBe("/checkout?plano=anual");
    expect(buildLandingCheckoutPath("monthly")).toBe("/checkout?plano=mensal");
  });

  it("produces a path the resolver can read back", () => {
    const path = buildLandingCheckoutPath("monthly");
    const value = new URLSearchParams(path.split("?")[1]).get("plano");
    expect(resolveLandingCheckoutPlan(value)).toBe("monthly");
  });
});

describe("startLandingCheckout", () => {
  const input = {
    name: "  Ana Souza ",
    email: " ana@example.com ",
    password: "StrongPass@123",
    plan: "annual" as const,
  };

  /**
   * Collaborators for the happy path; each case overrides the one it breaks.
   *
   * @returns Fresh spies so call assertions never leak between cases.
   */
  const happyDeps = (): LandingCheckoutDeps => ({
    register: vi.fn().mockResolvedValue({}),
    login: vi.fn().mockResolvedValue({ token: "tok_1" }),
    createCheckoutSession: vi
      .fn()
      .mockResolvedValue({ checkoutUrl: "https://abacate/pay/1" }),
  });

  it("registers, signs in and returns the provider URL", async () => {
    const deps = happyDeps();
    const outcome = await startLandingCheckout(input, deps);

    expect(outcome).toEqual({
      status: "redirect",
      url: "https://abacate/pay/1",
    });
    expect(deps.register).toHaveBeenCalledWith({
      name: "Ana Souza",
      email: "ana@example.com",
      password: "StrongPass@123",
    });
    expect(deps.createCheckoutSession).toHaveBeenCalledWith({
      token: "tok_1",
      planSlug: LANDING_CHECKOUT_PLANS.annual.apiSlug,
    });
  });

  it("sends the monthly offer slug when monthly is chosen", async () => {
    const deps = happyDeps();
    await startLandingCheckout({ ...input, plan: "monthly" }, deps);

    expect(deps.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ planSlug: "premium_monthly" }),
    );
  });

  it("reports an existing account on 409", async () => {
    const deps = happyDeps();
    deps.register = vi.fn().mockRejectedValue({ response: { status: 409 } });

    await expect(startLandingCheckout(input, deps)).resolves.toEqual({
      status: "account-exists",
    });
    expect(deps.login).not.toHaveBeenCalled();
  });

  it("treats a failed login after a successful register as an existing account", async () => {
    // The API conceals duplicate signups with a 201, so this is the only
    // signal that the email was already taken.
    const deps = happyDeps();
    deps.login = vi.fn().mockRejectedValue({ response: { status: 401 } });

    await expect(startLandingCheckout(input, deps)).resolves.toEqual({
      status: "account-exists",
    });
    expect(deps.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("treats an empty token the same way", async () => {
    const deps = happyDeps();
    deps.login = vi.fn().mockResolvedValue({ token: "" });

    await expect(startLandingCheckout(input, deps)).resolves.toEqual({
      status: "account-exists",
    });
  });

  it("surfaces a message when registration fails for another reason", async () => {
    const deps = happyDeps();
    deps.register = vi.fn().mockRejectedValue({ response: { status: 500 } });

    const outcome = await startLandingCheckout(input, deps);
    expect(outcome.status).toBe("error");
    expect(outcome).toHaveProperty("message", expect.any(String));
  });

  it("surfaces a message when the provider call fails", async () => {
    const deps = happyDeps();
    deps.createCheckoutSession = vi.fn().mockRejectedValue(new Error("502"));

    expect((await startLandingCheckout(input, deps)).status).toBe("error");
  });

  it("surfaces a message when the provider returns no URL", async () => {
    const deps = happyDeps();
    deps.createCheckoutSession = vi.fn().mockResolvedValue({ checkoutUrl: "" });

    expect((await startLandingCheckout(input, deps)).status).toBe("error");
  });

  it("never throws — a rejection without a response is still an outcome", async () => {
    const deps = happyDeps();
    deps.register = vi.fn().mockRejectedValue("boom");

    await expect(startLandingCheckout(input, deps)).resolves.toHaveProperty(
      "status",
      "error",
    );
  });
});
