import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NotificationsPage from "./notifications.vue";

const runtimeConfig = vi.hoisted(() => ({
  public: {
    pushNotificationsEnabled: false,
  },
}));

type PushHarnessState = "unsupported" | "unconfigured" | "ready" | "subscribed";
type FakeRef<T> = {
  __v_isRef: true;
  value: T;
};

const pushHarness = vi.hoisted(() => {
  /**
   * Creates a minimal Vue-compatible ref without relying on Vue imports inside `vi.hoisted`.
   *
   * @param value - Initial ref value.
   * @returns A tiny object that Vue's `proxyRefs` can unwrap in templates.
   */
  const createRef = <T>(value: T): FakeRef<T> => ({
    __v_isRef: true,
    value,
  });
  /**
   * Creates a readonly computed-like ref without touching hoisted Vue imports.
   *
   * @param getter - Computes the current value when Vue unwraps the ref.
   * @returns A tiny readonly ref-like object.
   */
  const createComputed = <T>(getter: () => T): FakeRef<T> => ({
    __v_isRef: true,
    get value(): T {
      return getter();
    },
  });

  const state = createRef<PushHarnessState>("unconfigured");

  return {
    state,
    isSubscribed: createComputed(() => state.value === "subscribed"),
    isBusy: createRef(false),
    permission: createRef<"default" | "granted" | "denied">("default"),
    error: createRef<string | null>(null),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  };
});

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
  useRuntimeConfig: (): typeof runtimeConfig => runtimeConfig,
}));

vi.mock("#app", () => ({
  useRuntimeConfig: (): typeof runtimeConfig => runtimeConfig,
}));

vi.mock("~/features/notifications/composables/usePushSubscription", () => ({
  usePushSubscription: (): typeof pushHarness => pushHarness,
}));

vi.mock("lucide-vue-next", () => ({
  Bell: { template: "<span data-testid='bell-icon' />" },
  BellRing: { template: "<span data-testid='bell-ring-icon' />" },
  CalendarClock: { template: "<span data-testid='calendar-clock-icon' />" },
  MailCheck: { template: "<span data-testid='mail-check-icon' />" },
  ShieldCheck: { template: "<span data-testid='shield-check-icon' />" },
}));

vi.mock("naive-ui", () => ({
  NAlert: {
    props: ["title"],
    template: "<aside><strong>{{ title }}</strong><slot /></aside>",
  },
  NButton: {
    props: ["href", "tag"],
    template: "<a :href='href'><slot /></a>",
  },
  NCard: { template: "<section><slot /></section>" },
  NSpin: { template: "<span data-testid='busy-spinner' />" },
  NSwitch: {
    props: ["value", "disabled"],
    emits: ["update:value"],
    template:
      "<button :disabled='disabled' @click='$emit(\"update:value\", !value)'>toggle</button>",
  },
  NTag: { template: "<span><slot /></span>" },
}));

describe("NotificationsPage", () => {
  beforeEach(() => {
    runtimeConfig.public.pushNotificationsEnabled = false;
    pushHarness.state.value = "unconfigured";
    pushHarness.permission.value = "default";
    pushHarness.error.value = null;
    pushHarness.isBusy.value = false;
    pushHarness.subscribe.mockReset();
    pushHarness.unsubscribe.mockReset();
  });

  it("explains due-date reminders across push and email channels", () => {
    const wrapper = mount(NotificationsPage);

    expect(wrapper.text()).toContain("Gastos prestes a vencer");
    expect(wrapper.text()).toContain("Push no navegador");
    expect(wrapper.text()).toContain("E-mail como fallback");
    expect(wrapper.text()).toContain("Disparo em preparação");
  });

  it("does not subscribe while push delivery is disabled by config", async () => {
    const wrapper = mount(NotificationsPage);

    await wrapper.find("button").trigger("click");

    expect(pushHarness.subscribe).not.toHaveBeenCalled();
  });

  it("allows opt-in when the feature is configured and ready", async () => {
    runtimeConfig.public.pushNotificationsEnabled = true;
    pushHarness.state.value = "ready";
    const wrapper = mount(NotificationsPage);

    await wrapper.find("button").trigger("click");

    expect(pushHarness.subscribe).toHaveBeenCalledTimes(1);
  });
});
