import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref, type App } from "vue";

import ConfirmEmailPage from "./confirm-email.vue";
import { ApiError } from "~/core/errors";
import type { ConfirmEmailResult } from "~/features/auth/services/auth-email.client";

const pushMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const analyticsCaptureMock = vi.hoisted(() => vi.fn());
const mutationHarness = vi.hoisted(() => ({
  current: null as null | {
    isPending: ReturnType<typeof ref<boolean>>;
    isSuccess: ReturnType<typeof ref<boolean>>;
    isError: ReturnType<typeof ref<boolean>>;
    error: ReturnType<typeof ref<Error | null>>;
    mutateAsync: ReturnType<typeof vi.fn>;
  },
}));
const routeQuery = vi.hoisted(() => ({
  current: { token: "safe-token" } as Record<string, string | undefined>,
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

vi.mock("~/features/auth/queries/use-confirm-email-mutation", () => ({
  useConfirmEmailMutation: (): NonNullable<typeof mutationHarness.current> => {
    if (!mutationHarness.current) {
      throw new Error("mutationHarness.current must be set before mount");
    }
    return mutationHarness.current;
  },
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { signIn: typeof signInMock } => ({ signIn: signInMock }),
}));

vi.mock("~/composables/useAnalytics", () => ({
  useAnalytics: (): { capture: typeof analyticsCaptureMock } => ({
    capture: analyticsCaptureMock,
  }),
}));

vi.mock("lucide-vue-next", () => ({
  CheckCircle2: { template: "<span data-testid='success-icon' />" },
  XCircle: { template: "<span data-testid='error-icon' />" },
}));

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["href", "tag", "type", "disabled"],
    emits: ["click"],
    template: `
      <a v-if="tag === 'a'" :href="href" class="n-button"><slot /></a>
      <button v-else class="n-button" :disabled="disabled" @click="$emit('click')"><slot /></button>
    `,
  },
  NSpin: { template: "<div data-testid='spinner' />" },
}));

const signedInResult: ConfirmEmailResult = {
  kind: "signed_in",
  message: "ok",
  token: "jwt-access-token",
  user: {
    identity: { id: "u-1", name: "Italo", email: "italo@auraxis.com.br" },
    email_verification: {
      verified: true,
      deadline_at: null,
      required_now: false,
      days_remaining: null,
    },
  },
};

/**
 * Installs the minimum Nuxt app context expected by page-level Vue tests.
 *
 * @param app Test app instance.
 */
function nuxtContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: "/confirm-email", meta: {}, params: {}, query: routeQuery.current },
    $router: { push: pushMock },
    $config: { public: {} },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({
          patch: vi.fn(),
          dispose: vi.fn(),
        })),
      },
    },
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
 * Mounts the confirm-email page with stable i18n test doubles.
 *
 * @returns Mounted page wrapper.
 */
function mountPage(): ReturnType<typeof mount> {
  return mount(ConfirmEmailPage, {
    global: {
      plugins: [{ install: nuxtContextPlugin }],
      mocks: { $t: (key: string): string => key },
    },
  });
}

describe("ConfirmEmailPage", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    routeQuery.current = { token: "safe-token" };
    window.history.pushState({}, "", "/confirm-email?token=safe-token");
    mutationHarness.current = {
      isPending: ref(false),
      isSuccess: ref(false),
      isError: ref(false),
      error: ref<Error | null>(null),
      mutateAsync: vi.fn(),
    };
  });

  it("falls back to the browser URL token when Nuxt route query is empty after hydration", async () => {
    routeQuery.current = {};
    window.history.pushState({}, "", "/confirm-email?token=url-token");
    mutationHarness.current!.mutateAsync.mockResolvedValue({
      kind: "confirmed_without_session",
      message: "E-mail confirmado. Entre para continuar.",
    } satisfies ConfirmEmailResult);

    mountPage();
    await flushPromises();

    expect(mutationHarness.current!.mutateAsync).toHaveBeenCalledWith("url-token");
  });

  it("keeps the original navigation token when Nuxt temporarily strips the query string", async () => {
    routeQuery.current = {};
    window.history.pushState({}, "", "/confirm-email");
    const navigationSpy = vi.spyOn(window.performance, "getEntriesByType").mockReturnValue([
      { name: "http://localhost/confirm-email?token=navigation-token" } as PerformanceNavigationTiming,
    ]);
    mutationHarness.current!.mutateAsync.mockResolvedValue({
      kind: "confirmed_without_session",
      message: "E-mail confirmado. Entre para continuar.",
    } satisfies ConfirmEmailResult);

    try {
      mountPage();
      await flushPromises();

      expect(mutationHarness.current!.mutateAsync).toHaveBeenCalledWith("navigation-token");
    } finally {
      navigationSpy.mockRestore();
    }
  });

  it("hydrates the session and redirects to dashboard when confirmation returns a session", async () => {
    vi.useFakeTimers();
    mutationHarness.current!.mutateAsync.mockImplementation(async () => {
      mutationHarness.current!.isSuccess.value = true;
      return signedInResult;
    });

    mountPage();
    await flushPromises();

    expect(signInMock).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: "jwt-access-token",
      userEmail: "italo@auraxis.com.br",
      emailVerified: true,
    }));

    await vi.advanceTimersByTimeAsync(800);

    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });

  it("shows success with login CTA when confirmation succeeds without a session", async () => {
    mutationHarness.current!.mutateAsync.mockImplementation(async () => {
      mutationHarness.current!.isSuccess.value = true;
      return {
        kind: "confirmed_without_session",
        message: "E-mail confirmado. Entre para continuar.",
      } satisfies ConfirmEmailResult;
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("pages.confirmEmail.successWithoutSessionTitle");
    expect(wrapper.find("a[href='/login']").exists()).toBe(true);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("shows a retry action when the confirmation request fails by network or timeout", async () => {
    mutationHarness.current!.mutateAsync.mockImplementation(async () => {
      mutationHarness.current!.isError.value = true;
      mutationHarness.current!.error.value = new ApiError(500, "timeout of 15000ms exceeded", "ECONNABORTED");
      throw mutationHarness.current!.error.value;
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("pages.confirmEmail.networkTitle");
    expect(wrapper.find("[data-testid='confirm-email-retry']").exists()).toBe(true);
  });

  it("shows resend CTA when the token is invalid, expired or already used", async () => {
    mutationHarness.current!.mutateAsync.mockImplementation(async () => {
      mutationHarness.current!.isError.value = true;
      mutationHarness.current!.error.value = new ApiError(
        400,
        "Link inválido ou expirado.",
        "INVALID_EMAIL_CONFIRMATION_TOKEN",
      );
      throw mutationHarness.current!.error.value;
    });

    const wrapper = mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("pages.confirmEmail.invalidTitle");
    expect(wrapper.find("a[href='/resend-confirmation']").exists()).toBe(true);
  });
});
