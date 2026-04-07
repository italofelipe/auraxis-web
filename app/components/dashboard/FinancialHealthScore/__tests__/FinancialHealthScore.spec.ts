import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FinancialHealthScore from "../FinancialHealthScore.vue";
import type { FinancialHealthScoreResult, HealthPillar } from "~/features/dashboard/composables/useFinancialHealthScore";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Stub ECharts-dependent components to avoid Canvas errors in JSDOM.
const globalStubs = {
  UiChart: { template: "<div class='ui-chart-stub' />" },
  HealthScoreGauge: {
    name: "HealthScoreGauge",
    props: ["score", "tier", "loading"],
    template: "<div class='hsg-stub' :data-score='score' :data-tier='tier' />",
  },
  UiSurfaceCard: {
    template: "<div><slot name='header' /><slot /></div>",
  },
};

// ── Factories ─────────────────────────────────────────────────────────────────

/**
 * Builds a HealthPillar with given score.
 *
 * @param key Pillar key.
 * @param score Numeric score or null.
 * @returns HealthPillar instance.
 */
function makePillar(key: string, score: number | null): HealthPillar {
  return {
    key,
    label: `Pillar ${key}`,
    score,
    maxScore: 20,
    tip: `Tip for ${key}`,
  };
}

/**
 * Builds a complete FinancialHealthScoreResult.
 *
 * @param overrides Fields to override.
 * @returns FinancialHealthScoreResult instance.
 */
function makeResult(
  overrides: Partial<FinancialHealthScoreResult> = {},
): FinancialHealthScoreResult {
  return {
    totalScore: 72,
    tier: "good",
    pillars: [
      makePillar("incomeCommitment", 20),
      makePillar("emergencyReserve", 15),
      makePillar("diversification", 12),
      makePillar("goalProgress", 10),
      makePillar("investmentRegularity", 15),
    ],
    history: [
      { month: "2025-01", score: 60 },
      { month: "2025-02", score: 72 },
    ],
    ...overrides,
  };
}

/**
 * Mounts FinancialHealthScore with canvas stubs.
 *
 * @param props Component props.
 * @param props.result Score result or null.
 * @param props.loading Optional loading flag.
 * @returns Mounted VueWrapper.
 */
function mountCard(props: { result: FinancialHealthScoreResult | null; loading?: boolean }): ReturnType<typeof mount<typeof FinancialHealthScore>> {
  return mount(FinancialHealthScore, { props, global: { stubs: globalStubs } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("FinancialHealthScore", () => {
  it("renders the card header title", () => {
    const wrapper = mountCard({ result: makeResult() });
    expect(wrapper.text()).toContain("Saúde Financeira");
  });

  it("shows loading skeletons when loading is true", () => {
    const wrapper = mountCard({ result: null, loading: true });
    expect(wrapper.find(".fhs__gauge-skeleton").exists()).toBe(true);
    expect(wrapper.findAll(".fhs__pillar-skeleton").length).toBe(5);
  });

  it("renders the gauge stub when result is available", () => {
    const wrapper = mountCard({ result: makeResult() });
    expect(wrapper.find(".hsg-stub").exists()).toBe(true);
  });

  it("renders all 5 pillar items", () => {
    const wrapper = mountCard({ result: makeResult() });
    expect(wrapper.findAll(".fhs__pillar")).toHaveLength(5);
  });

  it("shows pillar labels", () => {
    const wrapper = mountCard({ result: makeResult() });
    expect(wrapper.text()).toContain("Pillar incomeCommitment");
  });

  it("shows formatted score for calculable pillar", () => {
    const wrapper = mountCard({ result: makeResult() });
    // First pillar score = 20 → "20/20"
    expect(wrapper.text()).toContain("20/20");
  });

  it("shows em dash for null score pillar", () => {
    const result = makeResult({
      pillars: [
        makePillar("incomeCommitment", null),
        makePillar("emergencyReserve", 15),
        makePillar("diversification", 12),
        makePillar("goalProgress", 10),
        makePillar("investmentRegularity", 15),
      ],
    });
    const wrapper = mountCard({ result });
    expect(wrapper.text()).toContain("—");
  });

  it("shows improvement tips for each pillar", () => {
    const wrapper = mountCard({ result: makeResult() });
    expect(wrapper.findAll(".fhs__pillar-tip")).toHaveLength(5);
    expect(wrapper.text()).toContain("Tip for incomeCommitment");
  });

  it("renders sparkline section when history has > 1 entries", () => {
    const result = makeResult({
      history: [{ month: "2025-01", score: 60 }, { month: "2025-02", score: 72 }],
    });
    const wrapper = mountCard({ result });
    expect(wrapper.find(".fhs__history").exists()).toBe(true);
    expect(wrapper.find(".fhs__sparkline").exists()).toBe(true);
  });

  it("hides sparkline when history has <= 1 entries", () => {
    const wrapper = mountCard({ result: makeResult({ history: [{ month: "2025-01", score: 60 }] }) });
    expect(wrapper.find(".fhs__history").exists()).toBe(false);
  });

  it("shows empty state when result is null and not loading", () => {
    const wrapper = mountCard({ result: null, loading: false });
    expect(wrapper.text()).toContain("Score indisponível");
  });

  it("applies good pillar bar class when score is >= 70% of max", () => {
    // score = 20, maxScore = 20 → pct = 1.0 ≥ 0.7 → good
    const result = makeResult({
      pillars: [
        makePillar("incomeCommitment", 20),
        makePillar("emergencyReserve", 14),
        makePillar("diversification", 14),
        makePillar("goalProgress", 14),
        makePillar("investmentRegularity", 14),
      ],
    });
    const wrapper = mountCard({ result });
    expect(wrapper.find(".fhs__pillar-bar--good").exists()).toBe(true);
  });

  it("applies poor pillar bar class when score is < 40% of max", () => {
    // score = 5, maxScore = 20 → pct = 0.25 < 0.4 → poor
    const result = makeResult({
      pillars: [
        makePillar("incomeCommitment", 5),
        makePillar("emergencyReserve", 5),
        makePillar("diversification", 5),
        makePillar("goalProgress", 5),
        makePillar("investmentRegularity", 5),
      ],
    });
    const wrapper = mountCard({ result });
    expect(wrapper.find(".fhs__pillar-bar--poor").exists()).toBe(true);
  });

  it("applies unknown bar class for null score pillar", () => {
    const result = makeResult({
      pillars: [
        makePillar("incomeCommitment", null),
        makePillar("emergencyReserve", 15),
        makePillar("diversification", 12),
        makePillar("goalProgress", 10),
        makePillar("investmentRegularity", 15),
      ],
    });
    const wrapper = mountCard({ result });
    expect(wrapper.find(".fhs__pillar-bar--unknown").exists()).toBe(true);
  });

  it("passes the total score and tier to HealthScoreGauge stub", () => {
    const result = makeResult({ totalScore: 82, tier: "good" });
    const wrapper = mountCard({ result });
    const gauge = wrapper.find(".hsg-stub");
    expect(gauge.attributes("data-score")).toBe("82");
    expect(gauge.attributes("data-tier")).toBe("good");
  });

  it("applies fair pillar bar class when score is between 40-69% of max", () => {
    // score = 10, maxScore = 20 → pct = 0.5 (≥0.4 and < 0.7) → fair
    const result = makeResult({
      pillars: [
        makePillar("incomeCommitment", 10),
        makePillar("emergencyReserve", 10),
        makePillar("diversification", 10),
        makePillar("goalProgress", 10),
        makePillar("investmentRegularity", 10),
      ],
    });
    const wrapper = mountCard({ result });
    expect(wrapper.find(".fhs__pillar-bar--fair").exists()).toBe(true);
  });
});
