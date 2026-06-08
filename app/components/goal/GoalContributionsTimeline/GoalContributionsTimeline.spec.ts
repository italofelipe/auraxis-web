import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";

import GoalContributionsTimeline from "./GoalContributionsTimeline.vue";
import UiEmptyState from "~/components/ui/UiEmptyState/UiEmptyState.vue";
import UiInlineError from "~/components/ui/UiInlineError/UiInlineError.vue";
import type { GoalContributionDto } from "~/features/goals/contracts/contributions.dto";

/**
 * Builds a contribution fixture with optional overrides.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete GoalContributionDto fixture.
 */
const makeContribution = (
  overrides: Partial<GoalContributionDto> = {},
): GoalContributionDto => ({
  id: "c-1",
  goal_id: "goal-001",
  amount: 250,
  note: "Aporte mensal",
  occurred_at: "2026-06-01",
  created_at: "2026-06-01T10:00:00Z",
  ...overrides,
});

describe("GoalContributionsTimeline", () => {
  it("renders the error state when error is true", () => {
    const wrapper = mount(GoalContributionsTimeline, {
      props: { error: true },
    });
    expect(wrapper.findComponent(UiInlineError).exists()).toBe(true);
  });

  it("renders skeletons when loading is true", () => {
    const wrapper = mount(GoalContributionsTimeline, {
      props: { loading: true },
    });
    expect(wrapper.findAll("[data-testid='base-skeleton']").length).toBeGreaterThan(0);
  });

  it("renders the empty state when there are no items", () => {
    const wrapper = mount(GoalContributionsTimeline, {
      props: { items: [] },
    });
    expect(wrapper.findComponent(UiEmptyState).exists()).toBe(true);
  });

  it("renders a deposit with a + sign and the note", () => {
    const wrapper = mount(GoalContributionsTimeline, {
      props: { items: [makeContribution({ amount: 250, note: "Aporte mensal" })] },
    });
    expect(wrapper.text()).toContain("+");
    expect(wrapper.text()).toContain("Aporte mensal");
    expect(wrapper.text()).toContain("R$");
  });

  it("renders a withdrawal with a − sign and the negative modifier class", () => {
    const wrapper = mount(GoalContributionsTimeline, {
      props: { items: [makeContribution({ id: "c-2", amount: -50, note: null })] },
    });
    expect(wrapper.text()).toContain("−");
    expect(
      wrapper.find(".goal-contributions-timeline__amount--negative").exists(),
    ).toBe(true);
  });

  it("formats the occurred_at date as a pt-BR short date", () => {
    const wrapper = mount(GoalContributionsTimeline, {
      props: { items: [makeContribution({ occurred_at: "2026-06-01" })] },
    });
    expect(wrapper.text()).toContain("01/06/2026");
  });
});
