import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import WeeklySnapshotCard from "./WeeklySnapshotCard.vue";
import {
  WEEKLY_SNAPSHOT_SEEN_KEY,
  type WeeklySnapshot,
} from "~/features/weekly-snapshot/model/weekly-snapshot";

const mockHasPremium = ref(false);
const mockData = ref<WeeklySnapshot | null>(null);
const mockIsLoading = ref(false);
const mockIsError = ref(false);

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string; n: (v: number) => string } => ({
    t: (k: string) => k,
    n: (v: number) => String(v),
  }),
}));
vi.mock("#imports", () => ({
  useI18n: (): { t: (k: string) => string; n: (v: number) => string } => ({
    t: (k: string) => k,
    n: (v: number) => String(v),
  }),
}));

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: (): { data: typeof mockHasPremium } => ({ data: mockHasPremium }),
}));
vi.mock("~/features/weekly-snapshot/queries/use-weekly-snapshot-query", () => ({
  useWeeklySnapshotQuery: (): {
    data: typeof mockData;
    isLoading: typeof mockIsLoading;
    isError: typeof mockIsError;
  } => ({ data: mockData, isLoading: mockIsLoading, isError: mockIsError }),
}));

vi.mock("lucide-vue-next", () => ({
  CalendarRange: { template: "<span />" },
  Lock: { template: "<span />" },
  Sparkles: { template: "<span />" },
}));

vi.mock("naive-ui", () => ({
  NCard: { template: "<section><slot name='header' /><slot /></section>" },
  NSkeleton: { props: ["text", "repeat"], template: "<div class='n-skeleton' />" },
  NTag: { template: "<span><slot /></span>" },
  NButton: { props: ["type", "tag", "href", "size", "quaternary"], template: "<button @click='$emit(\"click\")'><slot /></button>", emits: ["click"] },
}));

const SNAPSHOT: WeeklySnapshot = {
  narrative: "Esta semana você gastou R$ 1.200.",
  weekStart: "2026-06-01",
  weekEnd: "2026-06-07",
  currentIncome: 5000,
  currentExpense: 1200,
  currentBalance: 3800,
  transactionCount: 14,
  expenseDeltaPercent: 10.09,
  balanceDeltaPercent: -2.81,
};

const stubs = {
  UiMetricCard: { props: ["label", "value", "trend"], template: "<div class='ui-metric-card'>{{ label }}: {{ value }}</div>" },
  UiInlineError: { props: ["message"], template: "<div class='ui-inline-error'>{{ message }}</div>" },
};

/**
 * @returns Mounted card wrapper.
 */
function mountCard(): ReturnType<typeof mount> {
  return mount(WeeklySnapshotCard, { global: { stubs } });
}

describe("WeeklySnapshotCard", () => {
  beforeEach(() => {
    mockHasPremium.value = false;
    mockData.value = null;
    mockIsLoading.value = false;
    mockIsError.value = false;
    window.localStorage.clear();
  });

  it("shows the premium teaser for free users", () => {
    const w = mountCard();
    expect(w.find("[data-testid='weekly-snapshot-locked']").exists()).toBe(true);
  });

  it("shows a skeleton while premium data loads", () => {
    mockHasPremium.value = true;
    mockIsLoading.value = true;
    const w = mountCard();
    expect(w.find("[data-testid='weekly-snapshot-loading']").exists()).toBe(true);
  });

  it("shows an error state when the premium query fails", () => {
    mockHasPremium.value = true;
    mockIsError.value = true;
    const w = mountCard();
    expect(w.find("[data-testid='weekly-snapshot-error']").exists()).toBe(true);
  });

  it("renders narrative and metrics for premium users with data", () => {
    mockHasPremium.value = true;
    mockData.value = SNAPSHOT;
    const w = mountCard();
    expect(w.text()).toContain("Esta semana você gastou");
    expect(w.findAll(".ui-metric-card").length).toBe(3);
  });

  it("shows a pending hint (and no narrative/badge) when not yet generated", () => {
    mockHasPremium.value = true;
    mockData.value = { ...SNAPSHOT, narrative: "" };
    const w = mountCard();
    expect(w.find("[data-testid='weekly-snapshot-pending']").exists()).toBe(true);
    expect(w.text()).toContain("weeklySnapshot.pending");
    // Metrics still render even without a narrative.
    expect(w.findAll(".ui-metric-card").length).toBe(3);
    // No NEW badge / mark-seen action without a real narrative.
    expect(w.find("[data-testid='weekly-snapshot-new-badge']").exists()).toBe(false);
    expect(w.find("[data-testid='weekly-snapshot-mark-seen']").exists()).toBe(false);
  });

  it("shows the NOVO badge when unseen and clears it on mark-seen", async () => {
    mockHasPremium.value = true;
    mockData.value = SNAPSHOT;
    const w = mountCard();
    expect(w.find("[data-testid='weekly-snapshot-new-badge']").exists()).toBe(true);

    await w.find("[data-testid='weekly-snapshot-mark-seen']").trigger("click");

    expect(window.localStorage.getItem(WEEKLY_SNAPSHOT_SEEN_KEY)).toBe("2026-06-01_2026-06-07_1200");
    expect(w.find("[data-testid='weekly-snapshot-new-badge']").exists()).toBe(false);
  });
});
