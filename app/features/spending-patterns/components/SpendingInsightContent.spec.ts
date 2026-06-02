import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import SpendingInsightContent from "./SpendingInsightContent.vue";
import type { SpendingPattern } from "~/features/spending-patterns/model/spending-patterns";

const mockTxData = ref<unknown[]>([]);
const mockTxLoading = ref(false);
const mockPatterns = ref<SpendingPattern[]>([]);
const mockPatternsLoading = ref(false);
const mockPatternsError = ref(false);

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

vi.mock("~/features/transactions/queries/use-list-transactions-query", () => ({
  useListTransactionsQuery: (): { data: typeof mockTxData; isLoading: typeof mockTxLoading } => ({
    data: mockTxData,
    isLoading: mockTxLoading,
  }),
}));
vi.mock("~/features/spending-patterns/queries/use-spending-patterns-query", () => ({
  useSpendingPatternsQuery: (): {
    data: typeof mockPatterns;
    isLoading: typeof mockPatternsLoading;
    isError: typeof mockPatternsError;
  } => ({ data: mockPatterns, isLoading: mockPatternsLoading, isError: mockPatternsError }),
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
    mockTxData.value = [];
    mockTxLoading.value = false;
    mockPatterns.value = [];
    mockPatternsLoading.value = false;
    mockPatternsError.value = false;
  });

  it("shows a skeleton while loading", () => {
    mockPatternsLoading.value = true;
    expect(mountContent().find("[data-testid='spending-insight-loading']").exists()).toBe(true);
  });

  it("shows a soft unavailable state on error", () => {
    mockPatternsError.value = true;
    expect(mountContent().find("[data-testid='spending-insight-error']").exists()).toBe(true);
  });

  it("shows the empty state when no patterns", () => {
    expect(mountContent().find("[data-testid='spending-insight-empty']").exists()).toBe(true);
  });

  it("renders the pattern list with a create-budget CTA", () => {
    mockPatterns.value = [PATTERN];
    const w = mountContent();
    const list = w.find("[data-testid='spending-insight-list']");
    expect(list.exists()).toBe(true);
    expect(w.text()).toContain("Cafés diários");
    expect(w.find("[data-testid='spending-insight-budget-cta']").exists()).toBe(true);
  });
});
