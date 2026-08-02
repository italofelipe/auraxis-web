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
    getErrorMessage: (): string => "erro-da-api",
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
 * Mounts the reset-password page with stable Nuxt and i18n test doubles.
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
        UiFormField: { props: ["label", "fieldId", "error", "required"], template: "<div><slot /></div>" },
      },
    },
  });
}

/**
 * Fills both password inputs and submits the form.
 *
 * @param wrapper Mounted page wrapper.
 * @param password Value typed into both fields.
 */
async function submitWith(
  wrapper: ReturnType<typeof mount>,
  password: string,
): Promise<void> {
  const inputs = wrapper.findAll("input");
  await inputs[0]?.setValue(password);
  await inputs[1]?.setValue(password);
  await flushPromises();
  await wrapper.find("form").trigger("submit");
  // vee-validate settles validation across both microtasks and timer callbacks
  // before the submit handler runs, so advancing fake timers is what actually
  // lets the submission through.
  await vi.advanceTimersByTimeAsync(50);
  await flushPromises();
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
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

    await submitWith(wrapper, VALID_PASSWORD);

    expect(mutationHarness.current?.mutateAsync).toHaveBeenCalledWith({
      token: "a".repeat(32),
      newPassword: VALID_PASSWORD,
    });
  });

  it("never sends a bare `password` field to the mutation", async () => {
    const wrapper = mountPage();

    await submitWith(wrapper, VALID_PASSWORD);

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
    expect(wrapper.find("form").exists()).toBe(false);
    expect(mutationHarness.current?.mutateAsync).not.toHaveBeenCalled();
  });

  it("shows the success state and redirects to login", async () => {
    const wrapper = mountPage();

    await submitWith(wrapper, VALID_PASSWORD);

    expect(wrapper.text()).toContain("auth.resetPassword.success");

    // The page waits 2s on the success screen before sending the user to login.
    await vi.advanceTimersByTimeAsync(2000);

    expect(pushMock).toHaveBeenCalledWith("/login");
  });

  it("surfaces the API error message when the reset fails", async () => {
    mutationHarness.current = {
      isPending: ref(false),
      mutateAsync: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const wrapper = mountPage();

    await submitWith(wrapper, VALID_PASSWORD);

    expect(wrapper.text()).toContain("erro-da-api");
  });

  it("blocks submission client-side when the password breaks the backend rules", async () => {
    const wrapper = mountPage();

    await submitWith(wrapper, "curta1!");

    expect(mutationHarness.current?.mutateAsync).not.toHaveBeenCalled();
  });
});
