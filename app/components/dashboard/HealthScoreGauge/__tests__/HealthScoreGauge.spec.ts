import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HealthScoreGauge from "../HealthScoreGauge.vue";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// UiChart wraps vue-echarts which requires a real Canvas — stub it in JSDOM.
const globalStubs = {
  UiChart: { template: "<div class='ui-chart-stub' />" },
};

/**
 * Mounts HealthScoreGauge with chart stubs to avoid Canvas issues in JSDOM.
 *
 * @param props Component props.
 * @param props.score Numeric score.
 * @param props.tier Semantic tier.
 * @param props.loading Optional loading flag.
 * @returns Mounted VueWrapper.
 */
function mountGauge(props: { score: number; tier: "good" | "fair" | "poor"; loading?: boolean }): ReturnType<typeof mount<typeof HealthScoreGauge>> {
  return mount(HealthScoreGauge, { props, global: { stubs: globalStubs } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HealthScoreGauge", () => {
  it("renders without error for each tier", () => {
    const tiers = ["good", "fair", "poor"] as const;
    for (const tier of tiers) {
      const wrapper = mountGauge({ score: 50, tier });
      expect(wrapper.exists()).toBe(true);
    }
  });

  it("shows skeleton when loading is true", () => {
    const wrapper = mountGauge({ score: 0, tier: "poor", loading: true });
    expect(wrapper.find(".hsg__skeleton").exists()).toBe(true);
    expect(wrapper.find(".hsg__chart").exists()).toBe(false);
  });

  it("hides skeleton when loading is false", () => {
    const wrapper = mountGauge({ score: 75, tier: "good", loading: false });
    expect(wrapper.find(".hsg__skeleton").exists()).toBe(false);
    expect(wrapper.find(".hsg__chart").exists()).toBe(true);
  });

  it("applies good tier class when tier is good", () => {
    const wrapper = mountGauge({ score: 80, tier: "good" });
    expect(wrapper.find(".hsg__tier--good").exists()).toBe(true);
    expect(wrapper.find(".hsg__tier").text()).toBe("Saudável");
  });

  it("applies fair tier class when tier is fair", () => {
    const wrapper = mountGauge({ score: 55, tier: "fair" });
    expect(wrapper.find(".hsg__tier--fair").exists()).toBe(true);
    expect(wrapper.find(".hsg__tier").text()).toBe("Moderado");
  });

  it("applies poor tier class when tier is poor", () => {
    const wrapper = mountGauge({ score: 20, tier: "poor" });
    expect(wrapper.find(".hsg__tier--poor").exists()).toBe(true);
    expect(wrapper.find(".hsg__tier").text()).toBe("Crítico");
  });

  it("sets aria-label with the score value", () => {
    const wrapper = mountGauge({ score: 62, tier: "fair" });
    expect(wrapper.find(".hsg").attributes("aria-label")).toContain("62");
  });
});
