import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import GoalAiContextPanel from "../GoalAiContextPanel.vue";
import type { GoalDto } from "~/features/goals/contracts/goal.dto";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

const useEntitlementQueryMock = vi.hoisted(() => vi.fn());
const useGoalAIProjectionMutationMock = vi.hoisted(() => vi.fn());
const mutateMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: useEntitlementQueryMock,
}));

vi.mock("~/features/goals/queries/use-goal-ai-projection-mutation", () => ({
  useGoalAIProjectionMutation: useGoalAIProjectionMutationMock,
}));

/**
 * Builds a goal fixture used by the AI context panel tests.
 *
 * @returns Goal DTO fixture.
 */
const makeGoal = (): GoalDto => ({
  id: "goal-001",
  name: "Reserva de emergencia",
  description: "6 meses de despesas",
  target_amount: 30000,
  current_amount: 12500,
  target_date: "2027-01-31",
  status: "active",
  created_at: "2026-01-01T00:00:00Z",
});

/**
 * Builds a transaction fixture for prompt-enrichment assertions.
 *
 * @param overrides Optional transaction fields to override.
 * @returns Transaction DTO fixture.
 */
const makeTransaction = (
  overrides: Partial<TransactionDto> = {},
): TransactionDto => ({
  id: "tx-1",
  title: "Salario",
  amount: "5000.00",
  type: "income",
  due_date: "2026-05-01",
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  recurrence_interval: 1,
  recurrence_unit: "month",
  currency: "BRL",
  status: "paid",
  start_date: null,
  end_date: null,
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  installment_group_id: null,
  paid_at: null,
  created_at: null,
  updated_at: null,
  ...overrides,
});

/**
 * Mounts the panel with a goal, simulated monthly contribution and recent transactions.
 *
 * @returns Mounted Vue wrapper.
 */
const mountPanel = (): ReturnType<typeof mount> =>
  mount(GoalAiContextPanel, {
    props: {
      goal: makeGoal(),
      monthlyContribution: 1200,
      recentTransactions: [
        makeTransaction({ amount: "5000.00", type: "income" }),
        makeTransaction({ id: "tx-2", amount: "1800.00", type: "expense" }),
      ],
    },
    global: {
      stubs: {
        UiUpgradePrompt: {
          props: ["featureName", "description", "ctaLabel", "to"],
          template: "<div class=\"upgrade-prompt\"><span>{{ featureName }}</span><button>{{ ctaLabel }}</button></div>",
        },
      },
    },
  });

describe("GoalAiContextPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEntitlementQueryMock.mockReturnValue({ data: ref(true), isLoading: ref(false) });
    useGoalAIProjectionMutationMock.mockReturnValue({
      mutate: mutateMock,
      data: ref(null),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    });
  });

  it("shows the premium upgrade prompt for users without advanced simulations entitlement", () => {
    useEntitlementQueryMock.mockReturnValue({ data: ref(false), isLoading: ref(false) });

    const wrapper = mountPanel();

    expect(wrapper.find(".upgrade-prompt").exists()).toBe(true);
    expect(wrapper.text()).toContain("Projecao de meta com IA");
    expect(wrapper.find("textarea").exists()).toBe(false);
  });

  it("submits user context enriched with recent transactions for premium users", async () => {
    const wrapper = mountPanel();

    await wrapper.find("textarea").setValue("Quero manter liquidez alta.");
    await wrapper.find("form").trigger("submit");

    expect(mutateMock).toHaveBeenCalledWith({
      goalId: "goal-001",
      payload: {
        monthly_contribution: 1200,
        user_context: expect.stringContaining("Ultimos 90 dias"),
      },
    });
    expect(mutateMock).toHaveBeenCalledWith({
      goalId: "goal-001",
      payload: {
        monthly_contribution: 1200,
        user_context: expect.stringContaining("entradas R$ 5.000,00"),
      },
    });
  });

  it("renders the generated narrative and exposes a save-as-note action", async () => {
    useGoalAIProjectionMutationMock.mockReturnValue({
      mutate: mutateMock,
      data: ref({
        narrative: "A meta segue viavel se o aporte mensal for mantido.",
        tokens_used: 420,
        cost_usd: 0.000062,
        model: "gpt-4o-mini",
        projection: {
          goal_id: "goal-001",
          current_amount: "12500.00",
          target_amount: "30000.00",
          remaining_amount: "17500.00",
          monthly_contribution: "1200.00",
          portfolio_monthly_return_rate: "0.008",
          portfolio_annual_return_rate_pct: "10.00",
          months_to_completion: 14,
          projected_completion_date: "2027-07-01",
          on_track: true,
          months_until_deadline: 18,
          suggested_monthly_contribution: null,
        },
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    });
    const wrapper = mountPanel();

    await wrapper.get("[data-testid=\"save-goal-ai-note\"]").trigger("click");

    expect(wrapper.text()).toContain("A meta segue viavel");
    expect(wrapper.emitted("save-note")).toHaveLength(1);
  });

  it("formats BRL suggested contributions without falling back to zero", () => {
    useGoalAIProjectionMutationMock.mockReturnValue({
      mutate: mutateMock,
      data: ref({
        narrative: "Aumente um pouco o aporte mensal.",
        tokens_used: 420,
        cost_usd: 0.000062,
        model: "gpt-4o-mini",
        projection: {
          goal_id: "goal-001",
          current_amount: "12500.00",
          target_amount: "30000.00",
          remaining_amount: "17500.00",
          monthly_contribution: "1200.00",
          portfolio_monthly_return_rate: "0.008",
          portfolio_annual_return_rate_pct: "10.00",
          months_to_completion: 14,
          projected_completion_date: "2027-07-01",
          on_track: false,
          months_until_deadline: 18,
          suggested_monthly_contribution: "R$ 1.450,25",
        },
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    });

    const wrapper = mountPanel();

    expect(wrapper.text()).toContain("R$ 1.450,25");
    expect(wrapper.text()).not.toContain("R$ 0,00");
  });
});
