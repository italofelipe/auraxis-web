import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type App } from "vue";

import ResetPasswordPage from "./reset-password.vue";

const pushMock = vi.hoisted(() => vi.fn());
const mutationHarness = vi.hoisted(() => ({
  current: null as null | {
    isPending: ReturnType<typeof ref<boolean>>;
    mutateAsync: ReturnType<typeof vi.fn>;
  },
}));
const routeQuery = vi.hoisted(() => ({
  current: { token: "a".repeat(32) } as Record<string, string | undefined>,
}));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  navigateTo: pushMock,
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
  useRoute: (): { query: Record<string, string | undefined> } => ({ query: routeQuery.current }),
  useRouter: (): { push: typeof pushMock } => ({ push: pushMock }),
  useSeoMeta: vi.fn(),
}));

vi.mock("#app", () => ({
  navigateTo: pushMock,
  useRoute: (): { query: Record<string, string | undefined> } => ({ query: routeQuery.current }),
  useRouter: (): { push: typeof pushMock } => ({ push: pushMock }),
}));

vi.mock("vue-router", () => ({
  useRoute: (): { query: Record<string, string | undefined> } => ({ query: routeQuery.current }),
  useRouter: (): { push: typeof pushMock } => ({ push: pushMock }),
}));

// The page reaches `navigateTo` through Nuxt auto-imports, which resolve to
// this module rather than to `#imports` — without this the real implementation
// runs inside the redirect timeout and fails with "nuxt instance unavailable".
vi.mock("#app/composables/router", () => ({
  navigateTo: pushMock,
  useRoute: (): { query: Record<string, string | undefined> } => ({ query: routeQuery.current }),
  useRouter: (): { push: typeof pushMock } => ({ push: pushMock }),
}));

vi.mock("~/composables/useAuth", () => ({
  useResetPasswordMutation: (): NonNullable<typeof mutationHarness.current> => {
    if (!mutationHarness.current) {
      throw new Error("mutationHarness.current must be set before mount");
    }
    return mutationHarness.current;
  },
}));

vi.mock("~/composables/useApiError", () => ({
  useApiError: (): { getErrorMessage: (error: unknown) => string } => ({
    getErrorMessage: (): string => "erro-generico",
  }),
}));

const VALID_PASSWORD = "NovaSenha@1";

/**
 * Installs the minimum Nuxt app context expected by page-level Vue tests.
 *
 * @param app Test app instance.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/reset-password", meta: {}, params: {}, query: routeQuery.current },
    $router: { push: pushMock },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: { head: { push: vi.fn(() => ({ patch: vi.fn(), dispose: vi.fn() })) } },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  });
}

/**
 * Mounts the page with the form stubbed — the form carries its own spec, so
 * this one covers orchestration: token handling, redirect and error mapping.
 *
 * @returns Mounted page wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(ResetPasswordPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
      mocks: { $t: (key: string): string => key },
      stubs: {
        NuxtLink: { props: ["to"], template: "<a :href='to'><slot /></a>" },
        ResetPasswordForm: {
          props: ["loading", "serverError"],
          emits: ["submit"],
          template: `<form data-testid="reset-form" @submit.prevent="$emit('submit', { password: '${VALID_PASSWORD}' })">
            <span data-testid="server-error">{{ serverError }}</span>
            <button type="submit">enviar</button>
          </form>`,
        },
      },
    },
  });
}

/**
 * Builds an Axios-shaped v2 validation error for a given field.
 *
 * @param field Field name the backend rejected.
 * @returns Error object shaped like the API envelope.
 */
function validationError(field: string): unknown {
  return {
    response: {
      status: 400,
      data: {
        success: false,
        message: "Validation error",
        error: { code: "VALIDATION_ERROR", details: { errors: { json: { [field]: ["bad"] } } } },
      },
    },
  };
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    routeQuery.current = { token: "a".repeat(32) };
    mutationHarness.current = {
      isPending: ref(false),
      mutateAsync: vi.fn().mockResolvedValue({ message: "ok" }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("submits the token with the domain-shaped newPassword field", async () => {
    const wrapper = mountPage();

    await wrapper.find("[data-testid=\"reset-form\"]").trigger("submit");
    await flushPromises();

    expect(mutationHarness.current?.mutateAsync).toHaveBeenCalledWith({
      token: "a".repeat(32),
      newPassword: VALID_PASSWORD,
    });
  });

  it("never sends a bare `password` field to the mutation", async () => {
    const wrapper = mountPage();

    await wrapper.find("[data-testid=\"reset-form\"]").trigger("submit");
    await flushPromises();

    const [payload] = mutationHarness.current?.mutateAsync.mock.calls[0] as [
      Record<string, unknown>,
    ];
    expect(payload).not.toHaveProperty("password");
  });

  it("renders the invalid-link state and does not call the API without a token", async () => {
    routeQuery.current = {};

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("auth.resetPassword.noToken");
    expect(wrapper.find("[data-testid=\"reset-form\"]").exists()).toBe(false);
    expect(mutationHarness.current?.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows the success state and redirects to login", async () => {
    vi.useFakeTimers();
    const wrapper = mountPage();

    await wrapper.find("[data-testid=\"reset-form\"]").trigger("submit");
    await vi.advanceTimersByTimeAsync(0);

    expect(wrapper.text()).toContain("auth.resetPassword.success");

    await vi.advanceTimersByTimeAsync(2000);
    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("explains the password rules when the backend rejects new_password", async () => {
    mutationHarness.current = {
      isPending: ref(false),
      mutateAsync: vi.fn().mockRejectedValue(validationError("new_password")),
    };
    const wrapper = mountPage();

    await wrapper.find("[data-testid=\"reset-form\"]").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-testid=\"server-error\"]").text()).toContain(
      "mínimo de 10 caracteres",
    );
  });

  it("says the link expired when the backend rejects the token", async () => {
    mutationHarness.current = {
      isPending: ref(false),
      mutateAsync: vi.fn().mockRejectedValue(validationError("token")),
    };
    const wrapper = mountPage();

    await wrapper.find("[data-testid=\"reset-form\"]").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-testid=\"server-error\"]").text()).toContain("Este link expirou");
  });

  it("falls back to the generic handler for anything else", async () => {
    mutationHarness.current = {
      isPending: ref(false),
      mutateAsync: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const wrapper = mountPage();

    await wrapper.find("[data-testid=\"reset-form\"]").trigger("submit");
    await flushPromises();

    expect(wrapper.find("[data-testid=\"server-error\"]").text()).toBe("erro-generico");
  });
});
