/**
 * Checkout model for the public landing (#1187).
 *
 * The buyer picks a plan on auraxis.com.br and goes straight to the AbacatePay
 * hosted checkout — no detour through app.auraxis.com.br. This module holds the
 * pure pieces of that flow: plan resolution from the URL and the orchestration
 * of register → login → checkout session, both testable without Vue.
 */

/** Plans the landing can sell, matching the pricing section. */
export type LandingCheckoutPlanKey = "monthly" | "annual";

export interface LandingCheckoutPlanSummary {
  readonly key: LandingCheckoutPlanKey;
  /** Value accepted in the `?plano=` query, in pt-BR. */
  readonly querySlug: string;
  readonly name: string;
  readonly price: string;
  readonly period: string;
  /** Secondary line under the price (savings, equivalent monthly value). */
  readonly note: string;
  /** Offer slug expected by `POST /subscriptions/checkout`. */
  readonly apiSlug: string;
}

/** The annual plan is the recommended one in the pricing section. */
export const DEFAULT_LANDING_CHECKOUT_PLAN: LandingCheckoutPlanKey = "annual";

export const LANDING_CHECKOUT_PLANS: Readonly<
  Record<LandingCheckoutPlanKey, LandingCheckoutPlanSummary>
> = {
  monthly: {
    key: "monthly",
    querySlug: "mensal",
    name: "Premium mensal",
    price: "R$ 29,90",
    period: "por mês",
    note: "Flexível — cancele quando quiser.",
    apiSlug: "premium_monthly",
  },
  annual: {
    key: "annual",
    querySlug: "anual",
    name: "Premium anual",
    price: "R$ 287,04",
    period: "por ano",
    note: "Equivale a R$ 23,92/mês — 20% de desconto.",
    apiSlug: "premium_annual",
  },
} as const;

/**
 * Matches a raw `?plano=` value against the sellable plans.
 *
 * @param raw Raw value — a string, an array (repeated param), or absent.
 * @returns The plan key, or null when nothing matches.
 */
const matchLandingCheckoutPlan = (
  raw: unknown,
): LandingCheckoutPlanKey | null => {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (typeof candidate !== "string") {
    return null;
  }
  const normalized = candidate.trim().toLowerCase();
  for (const plan of Object.values(LANDING_CHECKOUT_PLANS)) {
    if (normalized === plan.querySlug || normalized === plan.key) {
      return plan.key;
    }
  }
  return null;
};

/**
 * Resolves the plan a visitor asked for in the URL.
 *
 * Anything unrecognised falls back to the recommended plan instead of erroring:
 * a mistyped link should still be able to sell.
 *
 * @param raw Raw `?plano=` value — a string, an array (repeated param), or absent.
 * @returns The resolved plan key.
 */
export const resolveLandingCheckoutPlan = (
  raw: unknown,
): LandingCheckoutPlanKey =>
  matchLandingCheckoutPlan(raw) ?? DEFAULT_LANDING_CHECKOUT_PLAN;

/**
 * Reads the `plano` param out of a query string or a full URL.
 *
 * @param source `?plano=mensal`, `plano=mensal`, or `https://…/checkout?plano=mensal`.
 * @returns The raw param value, or null when absent or unparseable.
 */
const readPlanParam = (source: string | null | undefined): string | null => {
  if (!source) {
    return null;
  }
  try {
    if (source.includes("://")) {
      return new URL(source).searchParams.get("plano");
    }
    const search = source.startsWith("?") ? source : `?${source}`;
    return new URLSearchParams(search).get("plano");
  } catch {
    return null;
  }
};

/**
 * Resolves the plan from the Nuxt route, falling back to URL sources owned by
 * the browser.
 *
 * The checkout page is prerendered and, measured in a production build, at the
 * moment `onMounted` runs BOTH `route.query` and `window.location.search` are
 * empty — Nuxt strips the query while it normalises the route during hydration.
 * Since an unrecognised value silently falls back to the recommended plan, a
 * `?plano=mensal` link opened — and charged — the annual plan (#1203). The
 * navigation entry keeps the original URL and survives that window, which is
 * the same reason `pages/confirm-email.vue` reads it.
 *
 * @param routeValue Value read from the Nuxt route query.
 * @param urlSources URL-ish fallbacks, in priority order.
 * @returns The resolved plan key.
 */
export const resolveLandingCheckoutPlanFromSources = (
  routeValue: unknown,
  ...urlSources: (string | null | undefined)[]
): LandingCheckoutPlanKey => {
  const fromRoute = matchLandingCheckoutPlan(routeValue);
  if (fromRoute) {
    return fromRoute;
  }
  for (const source of urlSources) {
    const fromUrl = matchLandingCheckoutPlan(readPlanParam(source));
    if (fromUrl) {
      return fromUrl;
    }
  }
  return DEFAULT_LANDING_CHECKOUT_PLAN;
};

/**
 * Builds the landing-relative checkout path for a plan.
 *
 * @param plan Plan key.
 * @returns Path such as `/checkout?plano=anual`.
 */
export const buildLandingCheckoutPath = (
  plan: LandingCheckoutPlanKey,
): string => `/checkout?plano=${LANDING_CHECKOUT_PLANS[plan].querySlug}`;

// ---------------------------------------------------------------------------
// Checkout orchestration
// ---------------------------------------------------------------------------

export interface LandingCheckoutInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly plan: LandingCheckoutPlanKey;
}

/**
 * Collaborators the orchestration needs, injected so the flow is testable
 * without Nuxt, Axios or a session store.
 */
export interface LandingCheckoutDeps {
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<unknown>;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<{ token: string }>;
  createCheckoutSession: (input: {
    token: string;
    planSlug: string;
  }) => Promise<{ checkoutUrl: string }>;
}

export type LandingCheckoutOutcome =
  | { readonly status: "redirect"; readonly url: string }
  /** The email already has an account — the visitor must sign in instead. */
  | { readonly status: "account-exists" }
  | { readonly status: "error"; readonly message: string };

const ACCOUNT_EXISTS_STATUSES = new Set([409]);

/**
 * Copy shown whenever the purchase cannot start for a reason the visitor can
 * do nothing about. Exported so the page reuses the exact same sentence for
 * failures that never reach the orchestration (#1198).
 */
export const LANDING_CHECKOUT_GENERIC_ERROR =
  "Não conseguimos iniciar o pagamento agora. Tente de novo em instantes.";

const GENERIC_ERROR = LANDING_CHECKOUT_GENERIC_ERROR;

/**
 * Reads an HTTP status from an unknown rejection without assuming Axios.
 *
 * @param error Rejection value.
 * @returns The status code, or null when it cannot be determined.
 */
const statusOf = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const response = (error as { response?: { status?: unknown } }).response;
  const status = response?.status ?? (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
};

/**
 * Runs the landing purchase: create the account, sign in, open the checkout.
 *
 * Two failure modes get their own outcome because they need different copy:
 *
 * - **409 on register** — the email already has an account.
 * - **register succeeds but login fails** — the API conceals duplicate signups
 *   (`conceal_conflict` answers 201 without creating anything), so a login that
 *   fails right after a "successful" registration means the same thing.
 *
 * @param input Form values plus the chosen plan.
 * @param deps Injected collaborators.
 * @returns What the page should do next; never throws.
 */
export const startLandingCheckout = async (
  input: LandingCheckoutInput,
  deps: LandingCheckoutDeps,
): Promise<LandingCheckoutOutcome> => {
  try {
    await deps.register({
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
    });
  } catch (error) {
    if (ACCOUNT_EXISTS_STATUSES.has(statusOf(error) ?? 0)) {
      return { status: "account-exists" };
    }
    return { status: "error", message: GENERIC_ERROR };
  }

  let token: string;
  try {
    const session = await deps.login({
      email: input.email.trim(),
      password: input.password,
    });
    token = session.token;
  } catch {
    // Registration reported success but the credentials do not work: the
    // account already existed and the API concealed the conflict.
    return { status: "account-exists" };
  }

  if (!token) {
    return { status: "account-exists" };
  }

  try {
    const session = await deps.createCheckoutSession({
      token,
      planSlug: LANDING_CHECKOUT_PLANS[input.plan].apiSlug,
    });
    if (!session.checkoutUrl) {
      return { status: "error", message: GENERIC_ERROR };
    }
    return { status: "redirect", url: session.checkoutUrl };
  } catch {
    return { status: "error", message: GENERIC_ERROR };
  }
};
