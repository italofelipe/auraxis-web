import { describe, expect, it, vi } from "vitest";

import { InstallmentVsCashClient } from "./installment-vs-cash.client";
import type { InstallmentVsCashCalculationRequestDto } from "~/features/tools/contracts/installment-vs-cash.dto";

/**
 * Creates a minimal Axios-like HTTP mock.
 *
 * @returns HTTP mock with post spy.
 */
const createHttpMock = (): { post: ReturnType<typeof vi.fn> } => ({
  post: vi.fn(),
});

const payload: InstallmentVsCashCalculationRequestDto = {
  cash_price: "900.00",
  installment_count: 3,
  installment_total: "990.00",
  first_payment_delay_days: 30,
  opportunity_rate_type: "manual",
  opportunity_rate_annual: "12.00",
  inflation_rate_annual: "4.50",
  fees_enabled: false,
  fees_upfront: "0.00",
};

const calculationResponse = {
  tool_id: "installment_vs_cash",
  rule_version: "2026.1",
  input: {
    cash_price: "900.00",
    installment_count: 3,
    installment_amount: "330.00",
    installment_total: "990.00",
    first_payment_delay_days: 30,
    opportunity_rate_type: "manual",
    opportunity_rate_annual: "12.00",
    inflation_rate_annual: "4.50",
    fees_upfront: "0.00",
    scenario_label: null,
  },
  result: {
    recommended_option: "cash",
    recommendation_reason: "À vista",
    formula_explainer: "PV",
    comparison: {
      cash_option_total: "900.00",
      installment_option_total: "990.00",
      installment_present_value: "940.00",
      installment_real_value_today: "930.00",
      present_value_delta_vs_cash: "40.00",
      absolute_delta_vs_cash: "90.00",
      relative_delta_vs_cash_percent: "4.44",
      break_even_discount_percent: "9.09",
      break_even_opportunity_rate_annual: "18.20",
    },
    options: {
      cash: { total: "900.00" },
      installment: {
        count: 3,
        amounts: ["330.00", "330.00", "330.00"],
        installment_amount: "330.00",
        nominal_total: "990.00",
        upfront_fees: "0.00",
        first_payment_delay_days: 30,
      },
    },
    neutrality_band: {
      absolute_brl: "10.00",
      relative_percent: "1.00",
    },
    assumptions: {
      opportunity_rate_type: "manual",
      opportunity_rate_annual_percent: "12.00",
      inflation_rate_annual_percent: "4.50",
      periodicity: "monthly",
      first_payment_delay_days: 30,
      upfront_fees_apply_to: "installment",
      neutrality_rule: "hybrid",
    },
    indicator_snapshot: null,
    schedule: [],
  },
} as const;

const goalBridgeResponse = {
  goal: {
    id: "goal-1",
    title: "Notebook",
    description: null,
    category: null,
    target_amount: "900.00",
    current_amount: "0.00",
    priority: 3,
    target_date: null,
    status: "active",
    created_at: null,
    updated_at: null,
  },
  simulation: {
    id: "sim-1",
    user_id: "user-1",
    tool_id: "installment_vs_cash",
    rule_version: "2026.1",
    inputs: calculationResponse.input,
    result: calculationResponse.result,
    saved: true,
    goal_id: "goal-1",
    created_at: "2026-03-20T00:00:00.000Z",
  },
} as const;

describe("InstallmentVsCashClient", () => {
  it("calls the public calculate endpoint", async () => {
    const http = createHttpMock();
    http.post.mockResolvedValue({ data: calculationResponse });

    const client = new InstallmentVsCashClient(http as never);
    const result = await client.calculate(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/simulations/installment-vs-cash/calculate",
      payload,
    );
    expect(result.toolId).toBe("installment_vs_cash");
  });

  it("calls the premium goal bridge endpoint", async () => {
    const http = createHttpMock();
    http.post.mockResolvedValue({ data: goalBridgeResponse });

    const client = new InstallmentVsCashClient(http as never);
    const result = await client.createGoalFromSimulation("sim-1", {
      title: "Notebook",
      selectedOption: "cash",
      currentAmount: 0,
    });

    expect(http.post).toHaveBeenCalledWith("/simulations/sim-1/goal", {
      title: "Notebook",
      selected_option: "cash",
      description: undefined,
      category: undefined,
      target_date: undefined,
      priority: undefined,
      current_amount: "0.00",
    });
    expect(result.goal.title).toBe("Notebook");
  });

  it("calls the authenticated save endpoint", async () => {
    const http = createHttpMock();
    http.post.mockResolvedValue({
      data: {
        simulation: {
          id: "sim-1",
          user_id: "user-1",
          tool_id: "installment_vs_cash",
          rule_version: "2026.1",
          inputs: calculationResponse.input,
          result: calculationResponse.result,
          saved: true,
          goal_id: null,
          created_at: "2026-03-20T00:00:00.000Z",
        },
        calculation: calculationResponse,
      },
    });

    const client = new InstallmentVsCashClient(http as never);
    const result = await client.save(payload);

    expect(http.post).toHaveBeenCalledWith(
      "/simulations/installment-vs-cash/save",
      payload,
    );
    expect(result.simulation.saved).toBe(true);
  });

  it("calls the planned-expense bridge endpoint", async () => {
    const http = createHttpMock();
    http.post.mockResolvedValue({
      data: {
        transactions: [
          {
            id: "txn-1",
            title: "Notebook",
            amount: "330.00",
            type: "expense",
            due_date: "2026-04-15",
            start_date: null,
            end_date: null,
            description: null,
            observation: null,
            is_recurring: false,
            is_installment: true,
            installment_count: 3,
            tag_id: null,
            account_id: null,
            credit_card_id: null,
            status: "pending",
            currency: "BRL",
            created_at: null,
            updated_at: null,
          },
        ],
        simulation: goalBridgeResponse.simulation,
      },
    });

    const client = new InstallmentVsCashClient(http as never);
    const result = await client.createPlannedExpenseFromSimulation("sim-1", {
      title: "Notebook",
      selectedOption: "installment",
      firstDueDate: "2026-04-15",
    });

    expect(http.post).toHaveBeenCalledWith("/simulations/sim-1/planned-expense", {
      title: "Notebook",
      selected_option: "installment",
      description: undefined,
      observation: undefined,
      due_date: undefined,
      first_due_date: "2026-04-15",
      upfront_due_date: undefined,
      tag_id: undefined,
      account_id: undefined,
      credit_card_id: undefined,
      currency: "BRL",
      status: "pending",
    });
    expect(result.transactions[0]?.title).toBe("Notebook");
  });
});
