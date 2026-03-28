import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NSkeleton } from "naive-ui";

import SimulationCard from "./SimulationCard.vue";
import type { SimulationCardDto } from "../../contracts/simulation-card.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid SimulationCardDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete SimulationCardDto fixture.
 */
const makeSimulation = (overrides: Partial<SimulationCardDto> = {}): SimulationCardDto => ({
  id: "sim-test-001",
  name: "Simulação de teste",
  type: "installment_vs_cash",
  created_at: "2026-03-10T10:00:00Z",
  summary: "Resumo de resultado da simulação",
  result_value: 1500,
  ...overrides,
});

/**
 * Mounts SimulationCard with real Naive UI rendering.
 *
 * @param simulation - Simulation data to render.
 * @param loading - Optional loading state.
 * @returns VueWrapper around the mounted component.
 */
function mountSimulationCard(
  simulation: SimulationCardDto,
  loading = false,
): ReturnType<typeof mount> {
  return mount(SimulationCard, {
    props: { simulation, loading },
    global: {
      stubs: {
        Trash2Icon: { template: "<span data-testid='trash-icon' />" },
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SimulationCard", () => {
  it("renders the simulation name", () => {
    const wrapper = mountSimulationCard(makeSimulation({ name: "CDB 14% ao ano" }));
    expect(wrapper.text()).toContain("CDB 14% ao ano");
  });

  it("renders the correct NTag type for installment_vs_cash", () => {
    const wrapper = mountSimulationCard(makeSimulation({ type: "installment_vs_cash" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("info");
  });

  it("renders the correct NTag type for goal_projection", () => {
    const wrapper = mountSimulationCard(makeSimulation({ type: "goal_projection" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("success");
  });

  it("renders the correct NTag type for investment_return", () => {
    const wrapper = mountSimulationCard(makeSimulation({ type: "investment_return" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("warning");
  });

  it("renders the result_value formatted as currency", () => {
    const wrapper = mountSimulationCard(makeSimulation({ result_value: 2500 }));
    expect(wrapper.text()).toContain("R$");
    expect(wrapper.text()).toContain("2.500");
  });

  it("emits 'delete' with the simulation id when delete button is clicked", async () => {
    const sim = makeSimulation({ id: "sim-delete-01" });
    const wrapper = mountSimulationCard(sim);
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("delete")).toBeTruthy();
    expect(wrapper.emitted("delete")![0]).toEqual(["sim-delete-01"]);
  });

  it("shows NSkeleton elements when loading is true", () => {
    const wrapper = mountSimulationCard(makeSimulation(), true);
    expect(wrapper.findAllComponents(NSkeleton).length).toBeGreaterThan(0);
  });

  it("hides simulation name when loading is true", () => {
    const wrapper = mountSimulationCard(makeSimulation({ name: "Should not appear" }), true);
    expect(wrapper.text()).not.toContain("Should not appear");
  });

  it("shows '—' when result_value is null", () => {
    const wrapper = mountSimulationCard(makeSimulation({ result_value: null }));
    expect(wrapper.text()).toContain("—");
  });

  it("renders the simulation summary", () => {
    const wrapper = mountSimulationCard(makeSimulation({ summary: "Economia de R$ 500" }));
    expect(wrapper.text()).toContain("Economia de R$ 500");
  });
});
