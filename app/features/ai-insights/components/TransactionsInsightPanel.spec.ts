import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import TransactionsInsightPanel from "./TransactionsInsightPanel.vue";
import type { AIInsightDTO, AIInsightHistoryDTO } from "~/features/ai-insights/contracts/ai-insight";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string) => k }),
}));
vi.mock("#imports", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string) => k }),
}));

const historyState = {
  data: ref<AIInsightHistoryDTO | undefined>(undefined),
  isLoading: ref(false),
  isError: ref(false),
};

vi.mock("~/features/ai-insights/queries/use-ai-insights-history", () => ({
  useAIInsightsHistory: (): typeof historyState => historyState,
}));

const stubs = {
  NCollapse: { template: "<div data-testid='past-collapse'><slot /></div>" },
  AiInsightSection: {
    props: ["insight"],
    template:
      "<section data-testid='today-section'>{{ insight.map((item) => item.title).join(', ') }}</section>",
  },
  AiInsightAccordionItem: {
    props: ["item"],
    template: "<article data-testid='past-item'>{{ item.id }}</article>",
  },
  UiInlineError: { props: ["title", "message"], template: "<div data-testid='error'>{{ title }}</div>" },
  AppSkeleton: { template: "<div data-testid='skeleton' />" },
};

/**
 * Builds a transactions-dimension insight DTO for a given id and timestamp.
 *
 * @param id Insight id.
 * @param createdAt ISO datetime string.
 * @returns Insight history DTO entry.
 */
const makeInsight = (id: string, createdAt: string): AIInsightDTO => ({
  id,
  content: JSON.stringify({
    summary: "",
    items: [
      {
        type: "padrao_gasto",
        dimension: "transactions",
        title: `Insight ${id}`,
        message: "Mensagem",
      },
    ],
  }),
  insight_type: "daily",
  period_label: createdAt.slice(0, 10),
  period_start: createdAt.slice(0, 10),
  period_end: createdAt.slice(0, 10),
  model: "gpt-4o-mini",
  tokens_used: 100,
  cost_usd: 0.0001,
  created_at: createdAt,
});

// Pin the clock so "today" is deterministic regardless of the runner's
// timezone (the repo has a documented CI UTC-vs-local flake hazard). The
// component derives today from `new Date()`; freezing it to noon UTC keeps the
// fixture timestamp (2026-06-03T10:00:00Z) on the same local calendar day.
const FIXED_TODAY = "2026-06-03";

describe("TransactionsInsightPanel", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    historyState.data.value = undefined;
    historyState.isLoading.value = false;
    historyState.isError.value = false;
  });

  it("renders today's insight on top and past insights in the accordion below", () => {
    historyState.data.value = {
      items: [
        makeInsight("today", `${FIXED_TODAY}T10:00:00Z`),
        makeInsight("yesterday", "2026-01-02T10:00:00Z"),
      ],
      page: 1,
      per_page: 20,
      total: 2,
    };

    const wrapper = mount(TransactionsInsightPanel, { global: { stubs } });

    expect(wrapper.get("[data-testid='transactions-today-insight']").text()).toContain(
      "Insight today",
    );
    expect(wrapper.find("[data-testid='transactions-no-today']").exists()).toBe(false);

    const pastItems = wrapper.findAll("[data-testid='past-item']");
    expect(pastItems).toHaveLength(1);
    expect(pastItems[0]?.text()).toBe("yesterday");
  });

  it("renders the alt copy plus the past accordion when no insight was generated today", () => {
    historyState.data.value = {
      items: [
        makeInsight("yesterday", "2026-01-02T10:00:00Z"),
        makeInsight("older", "2026-01-01T10:00:00Z"),
      ],
      page: 1,
      per_page: 20,
      total: 2,
    };

    const wrapper = mount(TransactionsInsightPanel, { global: { stubs } });

    expect(wrapper.find("[data-testid='today-section']").exists()).toBe(false);
    expect(wrapper.get("[data-testid='transactions-no-today']").text()).toBe(
      "insights.history.noTodayYet",
    );
    expect(wrapper.findAll("[data-testid='past-item']")).toHaveLength(2);
  });

  it("shows the empty state when there are no insights at all", () => {
    historyState.data.value = { items: [], page: 1, per_page: 20, total: 0 };

    const wrapper = mount(TransactionsInsightPanel, { global: { stubs } });

    expect(wrapper.text()).toContain("insights.history.empty");
    expect(wrapper.find("[data-testid='today-section']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='past-item']").exists()).toBe(false);
  });

  it("renders a skeleton while the first history page is loading", () => {
    historyState.isLoading.value = true;

    const wrapper = mount(TransactionsInsightPanel, { global: { stubs } });

    expect(wrapper.find("[data-testid='skeleton']").exists()).toBe(true);
  });

  it("renders an inline error when the history query fails", () => {
    historyState.isError.value = true;

    const wrapper = mount(TransactionsInsightPanel, { global: { stubs } });

    expect(wrapper.get("[data-testid='error']").text()).toBe("insights.history.loadErrorTitle");
  });
});
