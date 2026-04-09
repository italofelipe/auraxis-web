import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { NSlider, NStatistic, NTag, NAlert } from "naive-ui";

import GoalProjectionPanel from "../GoalProjectionPanel.vue";
import type { GoalProjectionResponseDto } from "~/features/goals/contracts/goal.dto";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("vue-echarts", () => ({
  default: {
    name: "VChart",
    props: ["option", "theme", "autoresize", "style"],
    template: "<div class=\"mock-vchart\" />",
  },
}));

const useGoalProjectionQueryMock = vi.fn();

vi.mock("~/features/goals/queries/use-goal-projection-query", () => ({
  useGoalProjectionQuery: (goalId: unknown): unknown => useGoalProjectionQueryMock(goalId),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Builds a minimal GoalProjectionResponseDto fixture.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete GoalProjectionResponseDto fixture.
 */
function makeResponse(
  overrides: Partial<GoalProjectionResponseDto["projection"]> = {},
): GoalProjectionResponseDto {
  return {
    goal: {
      id: "goal-001",
      name: "Reserva de emergência",
      description: null,
      target_amount: 20000,
      current_amount: 5000,
      target_date: "2028-01-01",
      status: "active",
      created_at: "2025-01-01T00:00:00Z",
    },
    projection: {
      goal_id: "goal-001",
      current_amount: "5000.00",
      target_amount: "20000.00",
      remaining_amount: "15000.00",
      monthly_contribution: "800.00",
      portfolio_monthly_return_rate: "0.009489",
      portfolio_annual_return_rate_pct: "12.00",
      months_to_completion: 16,
      projected_completion_date: "2027-06-01",
      on_track: true,
      months_until_deadline: 24,
      suggested_monthly_contribution: null,
      ...overrides,
    },
  };
}

// ── Mount helper ──────────────────────────────────────────────────────────────

/**
 * Mounts GoalProjectionPanel with the given goalId and a pre-configured
 * query mock state.
 *
 * @param goalId - The goalId prop to pass.
 * @param queryState - The object returned by useGoalProjectionQuery mock.
 * @returns VueWrapper around the mounted component.
 */
function mountPanel(
  goalId: string | null,
  queryState: Record<string, unknown>,
): ReturnType<typeof mount> {
  useGoalProjectionQueryMock.mockReturnValue(queryState);
  return mount(GoalProjectionPanel, {
    props: { goalId },
    global: {
      stubs: {
        ClientOnly: { template: "<slot />" },
        UiSurfaceCard: { template: "<div><slot /></div>" },
        UiPageLoader: { template: "<div class=\"ui-page-loader\" />" },
        UiInlineError: {
          props: ["title", "message"],
          template: "<div class=\"ui-inline-error\">{{ title }}</div>",
        },
        UiChartPanel: { template: "<div class=\"ui-chart-panel\"><slot /></div>" },
        UiChart: { template: "<div class=\"ui-chart\" />" },
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GoalProjectionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when goalId is null", () => {
    useGoalProjectionQueryMock.mockReturnValue({
      data: ref(null),
      isLoading: ref(false),
      isError: ref(false),
    });
    const wrapper = mount(GoalProjectionPanel, {
      props: { goalId: null },
      global: {
        stubs: {
          UiSurfaceCard: { template: "<div><slot /></div>" },
          UiPageLoader: { template: "<div />" },
          UiInlineError: { template: "<div />" },
          UiChartPanel: { template: "<div />" },
          UiChart: { template: "<div />" },
          ClientOnly: { template: "<slot />" },
        },
      },
    });
    // UiSurfaceCard renders only when goalId !== null; the wrapper should be empty
    expect(wrapper.find(".goal-projection-panel").exists()).toBe(false);
  });

  it("shows loading state while fetching", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(null),
      isLoading: ref(true),
      isError: ref(false),
    });
    expect(wrapper.find(".ui-page-loader").exists()).toBe(true);
  });

  it("shows error state when query fails", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(null),
      isLoading: ref(false),
      isError: ref(true),
    });
    expect(wrapper.find(".ui-inline-error").exists()).toBe(true);
  });

  it("renders statistics when data is available", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse()),
      isLoading: ref(false),
      isError: ref(false),
    });
    const stats = wrapper.findAllComponents(NStatistic);
    expect(stats.length).toBeGreaterThanOrEqual(3);
  });

  it("renders NSlider for interactive monthly contribution", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse()),
      isLoading: ref(false),
      isError: ref(false),
    });
    expect(wrapper.findComponent(NSlider).exists()).toBe(true);
  });

  it("shows on-track tag when projection is on track", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse({ on_track: true })),
      isLoading: ref(false),
      isError: ref(false),
    });
    const tag = wrapper.findComponent(NTag);
    expect(tag.exists()).toBe(true);
    expect(tag.props("type")).toBe("success");
  });

  it("shows off-track tag when projection is off track", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse({ on_track: false, suggested_monthly_contribution: "1200.00" })),
      isLoading: ref(false),
      isError: ref(false),
    });
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("warning");
  });

  it("shows suggested contribution alert when off track", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse({ on_track: false, suggested_monthly_contribution: "1200.00" })),
      isLoading: ref(false),
      isError: ref(false),
    });
    expect(wrapper.findComponent(NAlert).exists()).toBe(true);
  });

  it("does not show suggested alert when on track", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse({ on_track: true, suggested_monthly_contribution: null })),
      isLoading: ref(false),
      isError: ref(false),
    });
    expect(wrapper.findComponent(NAlert).exists()).toBe(false);
  });

  it("renders the chart container when data is loaded", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse()),
      isLoading: ref(false),
      isError: ref(false),
    });
    expect(wrapper.find(".ui-chart-panel").exists()).toBe(true);
    expect(wrapper.find(".ui-chart").exists()).toBe(true);
  });

  it("initialises slider value from API monthly_contribution", () => {
    const wrapper = mountPanel("goal-001", {
      data: ref(makeResponse({ monthly_contribution: "900.00" })),
      isLoading: ref(false),
      isError: ref(false),
    });
    const slider = wrapper.findComponent(NSlider);
    expect(slider.props("value")).toBe(900);
  });

  it("passes goalId as a reactive ref to useGoalProjectionQuery", () => {
    mountPanel("goal-001", {
      data: ref(null),
      isLoading: ref(true),
      isError: ref(false),
    });
    expect(useGoalProjectionQueryMock).toHaveBeenCalledOnce();
    const calls = useGoalProjectionQueryMock.mock.calls as unknown as [[{ value: string | null }]];
    const [passedRef] = calls[0];
    expect(passedRef.value).toBe("goal-001");
  });
});
