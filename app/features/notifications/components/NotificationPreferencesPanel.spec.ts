import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import NotificationPreferencesPanel from "./NotificationPreferencesPanel.vue";
import type { NotificationPreference } from "~/features/notifications/model/notification-preferences";

const mockData = ref<NotificationPreference[]>([]);
const mockIsLoading = ref(false);
const mockIsPending = ref(false);
const mockMutateAsync = vi.fn().mockResolvedValue([]);
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string) => k }),
}));
vi.mock("#imports", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string) => k }),
}));

vi.mock("~/composables/useToast", () => ({
  useToast: (): { success: typeof mockToastSuccess; error: typeof mockToastError } => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));
vi.mock("~/features/notifications/queries/use-notification-preferences-query", () => ({
  useNotificationPreferencesQuery: (): { data: typeof mockData; isLoading: typeof mockIsLoading } => ({
    data: mockData,
    isLoading: mockIsLoading,
  }),
}));
vi.mock("~/features/notifications/queries/use-update-notification-preferences-mutation", () => ({
  useUpdateNotificationPreferencesMutation: (): {
    mutateAsync: typeof mockMutateAsync;
    isPending: typeof mockIsPending;
  } => ({ mutateAsync: mockMutateAsync, isPending: mockIsPending }),
}));

vi.mock("naive-ui", () => ({
  NCard: { template: "<section><slot /></section>" },
  NSpin: { template: "<span class='n-spin' />" },
  NSwitch: {
    props: ["value", "disabled"],
    emits: ["update:value"],
    template: "<button :disabled='disabled' @click='$emit(\"update:value\", !value)'>toggle</button>",
  },
}));

/**
 * @returns Mounted panel wrapper.
 */
function mountPanel(): ReturnType<typeof mount> {
  return mount(NotificationPreferencesPanel);
}

describe("NotificationPreferencesPanel", () => {
  beforeEach(() => {
    mockData.value = [];
    mockIsLoading.value = false;
    mockIsPending.value = false;
    mockMutateAsync.mockClear().mockResolvedValue([]);
    mockToastSuccess.mockClear();
    mockToastError.mockClear();
  });

  it("renders a toggle for every category with enabled defaults", () => {
    const w = mountPanel();
    expect(w.find("[data-testid='pref-due_soon']").exists()).toBe(true);
    expect(w.find("[data-testid='pref-goals']").exists()).toBe(true);
    expect(w.find("[data-testid='pref-subscription']").exists()).toBe(true);
  });

  it("persists a single category toggle", async () => {
    const w = mountPanel();
    await w.find("[data-testid='pref-due_soon']").trigger("click");
    expect(mockMutateAsync).toHaveBeenCalledWith([
      { category: "due_soon", enabled: false, globalOptOut: false },
    ]);
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("pauses all categories via the global opt-out", async () => {
    const w = mountPanel();
    await w.find("[data-testid='global-opt-out']").trigger("click");
    const arg = mockMutateAsync.mock.calls[0]?.[0] as NotificationPreference[];
    expect(arg).toHaveLength(5);
    expect(arg.every((p) => p.globalOptOut === true)).toBe(true);
  });

  it("surfaces an error toast when the mutation fails", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("boom"));
    const w = mountPanel();
    await w.find("[data-testid='pref-goals']").trigger("click");
    await Promise.resolve();
    expect(mockToastError).toHaveBeenCalled();
  });
});
