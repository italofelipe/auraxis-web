import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NProgress } from "naive-ui";

import GoalCard from "./GoalCard.vue";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Builds a complete GoalDto fixture with optional overrides.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete GoalDto fixture.
 */
const makeGoal = (overrides: Partial<GoalDto> = {}): GoalDto => ({
  id: "g-test",
  name: "Meta de teste",
  description: "Descrição da meta",
  target_amount: 10000,
  current_amount: 5000,
  target_date: "2026-12-31",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

/**
 * Mounts GoalCard with Naive UI components rendered in the happy-dom environment.
 *
 * @param goal - Goal data to render.
 * @param loading - Optional loading state.
 * @returns VueWrapper around the mounted component.
 */
function mountGoalCard(
  goal: GoalDto,
  loading = false,
): ReturnType<typeof mount> {
  return mount(GoalCard, { props: { goal, loading } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GoalCard", () => {
  it("renders the goal name", () => {
    const wrapper = mountGoalCard(makeGoal({ name: "Reserva de emergência" }));
    expect(wrapper.text()).toContain("Reserva de emergência");
  });

  it("renders correct status label for active goal", () => {
    const wrapper = mountGoalCard(makeGoal({ status: "active" }));
    expect(wrapper.text()).toContain("Ativa");
  });

  it("renders correct status label for completed goal", () => {
    const wrapper = mountGoalCard(makeGoal({ status: "completed" }));
    expect(wrapper.text()).toContain("Concluída");
  });

  it("renders correct status label for paused goal", () => {
    const wrapper = mountGoalCard(makeGoal({ status: "paused" }));
    expect(wrapper.text()).toContain("Pausada");
  });

  it("renders correct status label for cancelled goal", () => {
    const wrapper = mountGoalCard(makeGoal({ status: "cancelled" }));
    expect(wrapper.text()).toContain("Cancelada");
  });

  it("renders an NTag with correct type for active goal", () => {
    const wrapper = mountGoalCard(makeGoal({ status: "active" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.exists()).toBe(true);
    expect(tag.props("type")).toBe("info");
  });

  it("renders an NTag with correct type for completed goal", () => {
    const wrapper = mountGoalCard(makeGoal({ status: "completed" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("success");
  });

  it("renders formatted currency for current and target amount", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 5000, target_amount: 10000 }));
    expect(wrapper.text()).toContain("R$");
  });

  it("renders 0% progress label when current_amount is 0", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 0, target_amount: 10000 }));
    expect(wrapper.text()).toContain("0%");
  });

  it("renders 50% progress label when current_amount is half of target", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 5000, target_amount: 10000 }));
    expect(wrapper.text()).toContain("50%");
  });

  it("renders 100% progress label when goal is fully funded", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 10000, target_amount: 10000 }));
    expect(wrapper.text()).toContain("100%");
  });

  it("clamps progress to 100% when current exceeds target", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 12000, target_amount: 10000 }));
    const progress = wrapper.findComponent(NProgress);
    expect(progress.props("percentage")).toBe(100);
  });

  it("renders NProgress with correct percentage for 50% funded goal", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 5000, target_amount: 10000 }));
    const progress = wrapper.findComponent(NProgress);
    expect(progress.props("percentage")).toBe(50);
  });

  it("shows skeleton elements when loading is true", () => {
    const wrapper = mountGoalCard(makeGoal(), true);
    expect(wrapper.findAll("[data-testid='base-skeleton']").length).toBeGreaterThan(0);
    expect(wrapper.findComponent(NProgress).exists()).toBe(false);
  });

  it("emits edit when the edit button is clicked", async () => {
    const wrapper = mountGoalCard(makeGoal());
    const buttons = wrapper.findAll("button");
    const editButton = buttons.find((b) => b.text().includes("Editar"));
    expect(editButton).toBeTruthy();
    await editButton!.trigger("click");
    expect(wrapper.emitted("edit")).toBeTruthy();
  });

  it("emits show-plan when the plan button is clicked", async () => {
    const wrapper = mountGoalCard(makeGoal());
    const buttons = wrapper.findAll("button");
    const planButton = buttons.find((b) => b.text().includes("planejamento"));
    expect(planButton).toBeTruthy();
    await planButton!.trigger("click");
    expect(wrapper.emitted("show-plan")).toBeTruthy();
  });

  // ── Health indicator ──────────────────────────────────────────────────────

  it("shows completed health when current_amount equals target_amount", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 10000, target_amount: 10000, status: "active" }));
    expect(wrapper.text()).toContain("Concluída");
  });

  it("shows completed health when current_amount exceeds target_amount", () => {
    const wrapper = mountGoalCard(makeGoal({ current_amount: 12000, target_amount: 10000, status: "active" }));
    expect(wrapper.text()).toContain("Concluída");
  });

  it("shows at_risk health when target_date is within 30 days and progress < 100%", () => {
    const soon = new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10);
    const wrapper = mountGoalCard(makeGoal({ target_date: soon, current_amount: 1000, target_amount: 10000, status: "active" }));
    expect(wrapper.text()).toContain("Em risco");
  });

  it("does not crash when target_date is null", () => {
    expect(() =>
      mountGoalCard(makeGoal({ target_date: null as unknown as string })),
    ).not.toThrow();
  });

  it("does not crash and shows 0% when target_amount is 0", () => {
    expect(() =>
      mountGoalCard(makeGoal({ target_amount: 0, current_amount: 0 })),
    ).not.toThrow();
    const wrapper = mountGoalCard(makeGoal({ target_amount: 0, current_amount: 0 }));
    expect(wrapper.text()).toContain("0%");
  });
});
