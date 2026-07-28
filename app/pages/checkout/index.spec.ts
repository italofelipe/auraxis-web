import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CheckoutPage from "./index.vue";
import type * as NuxtRouterComposables from "#app/composables/router";
import type * as UnheadVue from "@unhead/vue";
import type * as LandingCheckoutModule from "~/features/landing/model/landing-checkout";
import type {
  LandingCheckoutDeps,
  LandingCheckoutOutcome,
} from "~/features/landing/model/landing-checkout";

/**
 * Page-level wiring tests for the landing checkout (#1198).
 *
 * The orchestration in `landing-checkout` is already covered by its own unit
 * tests with injected collaborators — what broke in production was the wiring:
 * `useHttp()` was resolved inside the click handler, outside the Vue setup
 * context, so the composable threw before any request left the browser and the
 * button stayed on "Preparando…" forever. These tests mount the real page and
 * exercise the handler, which is the only place that regression is visible.
 */

const postMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn(() => ({ post: postMock })));
const registerMock = vi.hoisted(() => vi.fn());
const loginMock = vi.hoisted(() => vi.fn());
const createAuthApiMock = vi.hoisted(() =>
  vi.fn(() => ({ register: registerMock, login: loginMock })),
);
const startLandingCheckoutMock = vi.hoisted(() => vi.fn());
const navigateToMock = vi.hoisted(() => vi.fn());
const captureMock = vi.hoisted(() => vi.fn());
const siteSurface = vi.hoisted(() => ({ current: "landing" as string }));

/** Nuxt auto-imports the page relies on, shared by every module alias below. */
const nuxtDoubles = vi.hoisted(() => ({
  definePageMeta: vi.fn(),
  navigateTo: (...args: unknown[]): unknown => navigateToMock(...args),
  useRoute: (): { query: Record<string, unknown> } => ({ query: {} }),
  useRuntimeConfig: (): { public: { siteSurface: string } } => ({
    public: { siteSurface: siteSurface.current },
  }),
  useSeoMeta: vi.fn(),
  useNuxtApp: (): Record<string, unknown> => ({
    _route: { path: "/checkout", query: {}, params: {}, meta: {} },
    $config: { public: { siteSurface: siteSurface.current } },
    runWithContext: <T,>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
  }),
}));

vi.mock("#imports", async () => ({
  ...(await import("vue")),
  ...nuxtDoubles,
}));

vi.mock("#app", () => ({ ...nuxtDoubles }));

vi.mock("#app/nuxt", () => ({ ...nuxtDoubles }));

vi.mock("nuxt/app", () => ({ ...nuxtDoubles }));

vi.mock("vue-router", () => ({ useRoute: nuxtDoubles.useRoute }));

vi.mock("@unhead/vue", async (importOriginal) => ({
  ...(await importOriginal<typeof UnheadVue>()),
  useSeoMeta: nuxtDoubles.useSeoMeta,
}));

vi.mock("#app/composables/router", async (importOriginal) => ({
  ...(await importOriginal<typeof NuxtRouterComposables>()),
  navigateTo: nuxtDoubles.navigateTo,
}));

vi.mock("#app/composables/head", () => ({
  useSeoMeta: nuxtDoubles.useSeoMeta,
  useHead: vi.fn(),
}));

vi.mock("~/composables/useHttp", () => ({ useHttp: useHttpMock }));

vi.mock("~/composables/useAnalytics/useAnalytics", () => ({
  useAnalytics: (): {
    capture: typeof captureMock;
    identify: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  } => ({
    capture: captureMock,
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

vi.mock("~/composables/useAuth", () => ({ createAuthApi: createAuthApiMock }));

vi.mock("~/features/landing/model/landing-checkout", async (importOriginal) => ({
  ...(await importOriginal<typeof LandingCheckoutModule>()),
  startLandingCheckout: startLandingCheckoutMock,
}));

vi.mock("lucide-vue-next", () => ({
  ArrowRight: { template: "<span data-testid='arrow-icon' />" },
}));

/**
 * Replaces `window.location` with a plain object so the redirect assignment is
 * observable instead of triggering a real navigation in happy-dom.
 *
 * @param search Query string the page should read on mount, e.g. `?plano=mensal`.
 * @returns The stub whose `href` the page writes to.
 */
function stubLocation(search = ""): { href: string; search: string } {
  const stub = { href: "", search };
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: stub,
  });
  return stub;
}

/** Form values used by every submission case — dummy data, not credentials. */
const FORM_NAME = "Italo";
const FORM_EMAIL = "italo@auraxis.com.br";
const FORM_SECRET = "senha-forte-123"; // gitleaks:allow

/**
 * Mounts the checkout page with a filled, submittable form.
 *
 * @returns Mounted page wrapper.
 */
async function mountFilledPage(): Promise<ReturnType<typeof mount>> {
  const wrapper = mount(CheckoutPage);
  await wrapper.find("[data-testid='landing-checkout-name']").setValue(FORM_NAME);
  await wrapper
    .find("[data-testid='landing-checkout-email']")
    .setValue(FORM_EMAIL);
  await wrapper
    .find("[data-testid='landing-checkout-password']")
    .setValue(FORM_SECRET);
  await wrapper.find("[data-testid='landing-checkout-terms']").setValue(true);
  return wrapper;
}

/**
 * Submits the checkout form and lets every pending promise settle.
 *
 * @param wrapper Mounted page wrapper.
 */
async function submitForm(wrapper: ReturnType<typeof mount>): Promise<void> {
  await wrapper.find("form").trigger("submit");
  await flushPromises();
}

describe("landing checkout page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteSurface.current = "landing";
    useHttpMock.mockReturnValue({ post: postMock });
    createAuthApiMock.mockReturnValue({
      register: registerMock,
      login: loginMock,
    });
    startLandingCheckoutMock.mockResolvedValue({
      status: "error",
      message: "erro",
    } satisfies LandingCheckoutOutcome);
    stubLocation();
  });

  it("resolves the HTTP client during setup, not inside the click handler", async () => {
    const wrapper = await mountFilledPage();

    // The regression that broke production: composables resolved lazily inside
    // `submit()` throw because there is no setup context in an event handler.
    expect(useHttpMock).toHaveBeenCalledTimes(1);
    expect(createAuthApiMock).toHaveBeenCalledTimes(1);

    await submitForm(wrapper);

    expect(useHttpMock).toHaveBeenCalledTimes(1);
    expect(createAuthApiMock).toHaveBeenCalledTimes(1);
  });

  it("sends the visitor to the provider checkout on success", async () => {
    const location = stubLocation();
    startLandingCheckoutMock.mockResolvedValue({
      status: "redirect",
      url: "https://pay.abacatepay.com/sess-1",
    } satisfies LandingCheckoutOutcome);

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    expect(location.href).toBe("https://pay.abacatepay.com/sess-1");
    // The button must stay busy while the browser leaves the page.
    expect(wrapper.text()).toContain("Preparando…");
  });

  it("wires the injected collaborators to the client resolved in setup", async () => {
    postMock.mockResolvedValue({ data: { data: { checkout_url: "https://pay/1" } } });
    loginMock.mockResolvedValue({ accessToken: "jwt-token" });

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    const deps = startLandingCheckoutMock.mock.calls[0]?.[1] as LandingCheckoutDeps;
    await deps.register({
      name: FORM_NAME,
      email: FORM_EMAIL,
      password: FORM_SECRET,
    });
    expect(registerMock).toHaveBeenCalledTimes(1);

    await expect(
      deps.login({ email: FORM_EMAIL, password: FORM_SECRET }),
    ).resolves.toEqual({ token: "jwt-token" });

    await expect(
      deps.createCheckoutSession({ token: "jwt-token", planSlug: "premium_annual" }),
    ).resolves.toEqual({ checkoutUrl: "https://pay/1" });
    expect(postMock).toHaveBeenCalledWith(
      "/subscriptions/checkout",
      { plan_slug: "premium_annual", return_surface: "landing" },
      {
        headers: {
          Authorization: "Bearer jwt-token",
          // The API answers 400 without it (#1200).
          "Idempotency-Key": expect.stringMatching(/^landing-checkout-/),
        },
      },
    );
  });

  it("points an existing account to login and frees the button", async () => {
    startLandingCheckoutMock.mockResolvedValue({
      status: "account-exists",
    } satisfies LandingCheckoutOutcome);

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    expect(
      wrapper.find("[data-testid='landing-checkout-account-exists']").exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain("Ir para o pagamento");
  });

  it("shows the outcome message when the API refuses the purchase", async () => {
    startLandingCheckoutMock.mockResolvedValue({
      status: "error",
      message: "Não conseguimos iniciar o pagamento agora.",
    } satisfies LandingCheckoutOutcome);

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    expect(wrapper.find("[data-testid='landing-checkout-error']").text()).toContain(
      "Não conseguimos iniciar o pagamento agora.",
    );
    expect(wrapper.text()).toContain("Ir para o pagamento");
  });

  it("never leaves the button stuck when something unexpected throws", async () => {
    startLandingCheckoutMock.mockRejectedValue(new Error("boom"));

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    expect(wrapper.text()).not.toContain("Preparando…");
    expect(wrapper.find("[data-testid='landing-checkout-error']").exists()).toBe(true);
  });

  it("honours ?plano=mensal from the browser URL when the hydrated route is empty", async () => {
    // The page is prerendered: `route.query` hydrates empty and the silent
    // fallback used to send the annual plan on a monthly link (#1203).
    stubLocation("?plano=mensal");
    startLandingCheckoutMock.mockResolvedValue({
      status: "account-exists",
    } satisfies LandingCheckoutOutcome);

    const wrapper = await mountFilledPage();
    await flushPromises();
    await submitForm(wrapper);

    expect(startLandingCheckoutMock.mock.calls[0]?.[0]).toMatchObject({
      plan: "monthly",
    });
  });

  it("falls back to the navigation URL when Nuxt has stripped the query entirely", async () => {
    // What actually happens in production: at `onMounted` the route query AND
    // `location.search` are both empty, and only the navigation entry still
    // carries the plan the visitor clicked (#1203).
    stubLocation("");
    const navigationSpy = vi
      .spyOn(window.performance, "getEntriesByType")
      .mockReturnValue([
        { name: "https://auraxis.com.br/checkout?plano=mensal" } as PerformanceNavigationTiming,
      ]);
    startLandingCheckoutMock.mockResolvedValue({
      status: "account-exists",
    } satisfies LandingCheckoutOutcome);

    try {
      const wrapper = await mountFilledPage();
      await flushPromises();
      await submitForm(wrapper);

      expect(startLandingCheckoutMock.mock.calls[0]?.[0]).toMatchObject({
        plan: "monthly",
      });
    } finally {
      navigationSpy.mockRestore();
    }
  });

  it("emite o funil na ordem submit → upgrade_clicked → provider_redirected (#1208)", async () => {
    const location = stubLocation();
    startLandingCheckoutMock.mockResolvedValue({
      status: "redirect",
      url: "https://pay.abacatepay.com/sess-1",
    } satisfies LandingCheckoutOutcome);

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    expect(location.href).toBe("https://pay.abacatepay.com/sess-1");
    expect(captureMock.mock.calls.map((call) => call[0])).toEqual([
      "checkout_form_submitted",
      "upgrade_clicked",
      "checkout_provider_redirected",
    ]);
    expect(captureMock).toHaveBeenNthCalledWith(2, "upgrade_clicked", {
      source: "landing-checkout",
      plan_slug: "annual",
    });
  });

  it("registra checkout_account_exists no conceal de conta duplicada (#1208)", async () => {
    startLandingCheckoutMock.mockResolvedValue({
      status: "account-exists",
    } satisfies LandingCheckoutOutcome);

    const wrapper = await mountFilledPage();
    await submitForm(wrapper);

    expect(captureMock).toHaveBeenCalledWith("checkout_account_exists", {
      plan_slug: "annual",
    });
  });

  it("registra checkout_failed distinguindo outcome de exceção (#1208)", async () => {
    const wrapper = await mountFilledPage();
    await submitForm(wrapper);
    expect(captureMock).toHaveBeenCalledWith("checkout_failed", {
      plan_slug: "annual",
      reason: "outcome",
    });

    captureMock.mockClear();
    startLandingCheckoutMock.mockRejectedValue(new Error("boom"));
    await submitForm(wrapper);
    expect(captureMock).toHaveBeenCalledWith("checkout_failed", {
      plan_slug: "annual",
      reason: "exception",
    });
  });

  it("hands the app surface over to the in-app subscription screen", async () => {
    siteSurface.current = "app";

    mount(CheckoutPage);
    await flushPromises();

    expect(navigateToMock).toHaveBeenCalledWith("/subscription");
  });
});
