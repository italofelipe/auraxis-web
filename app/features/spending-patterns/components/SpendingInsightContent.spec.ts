import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import SpendingInsightContent from "./SpendingInsightContent.vue";
import type {
  SpendingPattern,
  SpendingPatternsLatest,
} from "~/features/spending-patterns/model/spending-patterns";

const mockData = ref<SpendingPatternsLatest | undefined>(undefined);
const mockLoading = ref(false);
const mockError = ref(false);

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

vi.mock("~/features/spending-patterns/queries/use-spending-patterns-latest-query", () => ({
  useSpendingPatternsLatestQuery: (): {
    data: typeof mockData;
    isLoading: typeof mockLoading;
    isError: typeof mockError;
  } => ({ data: mockData, isLoading: mockLoading, isError: mockError }),
}));

vi.mock("naive-ui", () => ({
  NSkeleton: { props: ["text", "repeat"], template: "<div class='n-skeleton' />" },
  NTag: { props: ["type", "size", "round"], template: "<span><slot /></span>" },
  NButton: { props: ["size", "quaternary"], template: "<button><slot /></button>" },
}));

const stubs = { NuxtLink: { props: ["to"], template: "<a><slot /></a>" } };

const PATTERN: SpendingPattern = {
  description: "Cafés diários",
  frequency: "diária",
  averageValue: 12.5,
  suggestedAction: "Defina um teto mensal",
  severity: "high",
};

/**
 * @returns Mounted content wrapper.
 */
function mountContent(): ReturnType<typeof mount> {
  return mount(SpendingInsightContent, { global: { stubs } });
}

describe("SpendingInsightContent", () => {
  beforeEach(() => {
    mockData.value = undefined;
    mockLoading.value = false;
    mockError.value = false;
  });

  it("shows a skeleton while loading", () => {
    mockLoading.value = true;
    expect(mountContent().find("[data-testid='spending-insight-loading']").exists()).toBe(true);
  });

  it("shows a soft unavailable state on error", () => {
    mockError.value = true;
    expect(mountContent().find("[data-testid='spending-insight-error']").exists()).toBe(true);
  });

  it("shows the empty state when the cron has not produced an analysis yet", () => {
    mockData.value = { patterns: [], generatedAt: null };
    expect(mountContent().find("[data-testid='spending-insight-empty']").exists()).toBe(true);
  });

  it("renders the cached pattern list with a create-budget CTA", () => {
    mockData.value = { patterns: [PATTERN], generatedAt: "2026-06-05T06:00:00" };
    const w = mountContent();
    const list = w.find("[data-testid='spending-insight-list']");
    expect(list.exists()).toBe(true);
    expect(w.text()).toContain("Cafés diários");
    expect(w.find("[data-testid='spending-insight-budget-cta']").exists()).toBe(true);
  });
});
