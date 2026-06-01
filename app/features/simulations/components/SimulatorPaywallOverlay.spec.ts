import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SimulatorPaywallOverlay from "./SimulatorPaywallOverlay.vue";

const captureMock = vi.fn();

vi.mock("~/composables/useAnalytics/useAnalytics", () => ({
  useAnalytics: (): Record<string, unknown> => ({
    capture: captureMock,
    identify: vi.fn(),
    reset: vi.fn(),
  }),
}));

const STUBS = {
  NCard: { template: "<div><slot /></div>" },
  NButton: {
    template: "<button data-testid='simulator-paywall-cta'><slot /></button>",
  },
};

describe("SimulatorPaywallOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emite paywall_shown ao montar", () => {
    mount(SimulatorPaywallOverlay, { global: { stubs: STUBS } });

    expect(captureMock).toHaveBeenCalledWith("paywall_shown", {
      feature: "goal_simulator",
      quota: 1,
    });
  });

  it("emite upgrade_clicked e o evento upgrade no CTA", async () => {
    const wrapper = mount(SimulatorPaywallOverlay, { global: { stubs: STUBS } });

    await wrapper.get("[data-testid='simulator-paywall-cta']").trigger("click");

    expect(captureMock).toHaveBeenCalledWith("upgrade_clicked", {
      feature: "goal_simulator",
      source: "simulator_paywall",
    });
    expect(wrapper.emitted("upgrade")).toHaveLength(1);
  });

  it("renderiza a cópia padrão e aceita override por props", () => {
    const wrapper = mount(SimulatorPaywallOverlay, {
      props: { title: "Título custom" },
      global: { stubs: STUBS },
    });

    expect(wrapper.text()).toContain("Título custom");
  });
});
