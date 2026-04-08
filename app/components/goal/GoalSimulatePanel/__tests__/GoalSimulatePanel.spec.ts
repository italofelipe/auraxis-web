import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NInputNumber } from "naive-ui";

import GoalSimulatePanel from "../GoalSimulatePanel.vue";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Builds a complete GoalDto fixture with optional overrides.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete GoalDto fixture.
 */
const makeGoal = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: "g-sim-test",
  name: "Meta simulação",
  description: null,
  target_amount: 12000,
  current_amount: 0,
  target_date: "2027-12-31",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

/**
 * Mounts GoalSimulatePanel with the given goal and optional initialMonthly.
 *
 * @param goal - Goal data to pass as prop.
 * @param initialMonthly - Optional initial monthly contribution.
 * @returns VueWrapper around the mounted component.
 */
function mountPanel(
  goal: GoalDto,
  initialMonthly?: number,
): ReturnType<typeof mount> {
  return mount(GoalSimulatePanel, { props: { goal, initialMonthly } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GoalSimulatePanel", () => {
  it("renders the monthly contribution input", () => {
    const wrapper = mountPanel(makeGoal());
    const inputs = wrapper.findAllComponents(NInputNumber);
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the annual return input", () => {
    const wrapper = mountPanel(makeGoal());
    const inputs = wrapper.findAllComponents(NInputNumber);
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("initialises monthly contribution from initialMonthly prop", () => {
    const wrapper = mountPanel(makeGoal(), 500);
    const inputs = wrapper.findAllComponents(NInputNumber);
    expect(inputs[0]?.props("value")).toBe(500);
  });

  it("shows 'não será atingida' when monthly contribution is 0", () => {
    const wrapper = mountPanel(makeGoal({ current_amount: 0, target_amount: 12000 }), 0);
    expect(wrapper.text()).toContain("não será atingida");
  });

  it("shows projection text when monthly contribution is positive", async () => {
    const wrapper = mountPanel(makeGoal(), 1000);
    // Trigger reactivity by setting prop value
    const inputs = wrapper.findAllComponents(NInputNumber);
    await inputs[0]?.setValue(1000);
    expect(wrapper.text()).toMatch(/Projeção|meses/);
  });

  it("does not crash when current_amount equals target_amount", () => {
    expect(() =>
      mountPanel(makeGoal({ current_amount: 12000, target_amount: 12000 }), 500),
    ).not.toThrow();
  });

  it("shows projection text when monthly contribution is positive with zero return rate", () => {
    const wrapper = mountPanel(makeGoal({ current_amount: 0, target_amount: 12000 }), 1000);
    // 12000 / 1000 = 12 months (zero rate path)
    expect(wrapper.text()).toMatch(/Projeção.*12.*meses|12.*meses/);
  });

  it("shows projection text with a positive annual return rate", async () => {
    const wrapper = mountPanel(makeGoal({ current_amount: 0, target_amount: 12000 }), 1000);
    const inputs = wrapper.findAllComponents(NInputNumber);
    // Emit update:value on the return rate input to trigger compound growth path
    await inputs[1]?.vm.$emit("update:value", 12);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toMatch(/Projeção|meses/);
  });

  it("updates monthly contribution when initialMonthly prop changes", async () => {
    const wrapper = mountPanel(makeGoal(), 100);
    await wrapper.setProps({ initialMonthly: 800 });
    const inputs = wrapper.findAllComponents(NInputNumber);
    expect(inputs[0]?.props("value")).toBe(800);
  });
});
