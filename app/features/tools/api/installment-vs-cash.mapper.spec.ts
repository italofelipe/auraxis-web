import { describe, expect, it } from "vitest";

import {
  mapInstallmentVsCashCalculationDto,
  mapInstallmentVsCashGoalBridgeResponseDto,
  mapInstallmentVsCashPlannedExpenseBridgeResponseDto,
  mapInstallmentVsCashSaveResponseDto,
} from "./installment-vs-cash.mapper";
import type {
  CreateGoalFromInstallmentVsCashResponseDto,
  CreatePlannedExpenseFromInstallmentVsCashResponseDto,
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashSaveResponseDto,
} from "~/features/tools/contracts/installment-vs-cash.dto";

const calculationDto: InstallmentVsCashCalculationResponseDto = {
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
    scenario_label: "Notebook",
  },
  result: {
    recommended_option: "cash",
    recommendation_reason: "À vista ficou melhor.",
    formula_explainer: "Comparação por valor presente.",
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
    schedule: [
      {
        installment_number: 1,
        due_in_days: 30,
        amount: "330.00",
        present_value: "326.00",
        real_value_today: "328.00",
        cumulative_nominal: "330.00",
        cumulative_present_value: "326.00",
        cumulative_real_value_today: "328.00",
        cash_cumulative: "900.00",
      },
    ],
  },
};

describe("installment-vs-cash mapper", () => {
  it("maps the calculate response into a numeric domain object", () => {
    const result = mapInstallmentVsCashCalculationDto(calculationDto);

    expect(result.toolId).toBe("installment_vs_cash");
    expect(result.input.cashPrice).toBe(900);
    expect(result.result.comparison.installmentPresentValue).toBe(940);
    expect(result.result.schedule[0]?.presentValue).toBe(326);
  });

  it("maps the save response bundle", () => {
    const dto: InstallmentVsCashSaveResponseDto = {
      simulation: {
        id: "sim-1",
        user_id: "user-1",
        tool_id: "installment_vs_cash",
        rule_version: "2026.1",
        inputs: calculationDto.input,
        result: calculationDto.result,
        saved: true,
        goal_id: null,
        created_at: "2026-03-20T00:00:00.000Z",
      },
      calculation: calculationDto,
    };

    const result = mapInstallmentVsCashSaveResponseDto(dto);

    expect(result.simulation.saved).toBe(true);
    expect(result.calculation.result.recommendedOption).toBe("cash");
  });

  it("maps the goal bridge response", () => {
    const dto: CreateGoalFromInstallmentVsCashResponseDto = {
      goal: {
        id: "goal-1",
        title: "Notebook novo",
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
        inputs: calculationDto.input,
        result: calculationDto.result,
        saved: true,
        goal_id: "goal-1",
        created_at: "2026-03-20T00:00:00.000Z",
      },
    };

    const result = mapInstallmentVsCashGoalBridgeResponseDto(dto);

    expect(result.goal.targetAmount).toBe(900);
    expect(result.simulation.goalId).toBe("goal-1");
  });

  it("maps the planned-expense bridge response", () => {
    const dto: CreatePlannedExpenseFromInstallmentVsCashResponseDto = {
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
      simulation: {
        id: "sim-1",
        user_id: "user-1",
        tool_id: "installment_vs_cash",
        rule_version: "2026.1",
        inputs: calculationDto.input,
        result: calculationDto.result,
        saved: true,
        goal_id: null,
        created_at: "2026-03-20T00:00:00.000Z",
      },
    };

    const result = mapInstallmentVsCashPlannedExpenseBridgeResponseDto(dto);

    expect(result.transactions[0]?.amount).toBe(330);
    expect(result.transactions[0]?.isInstallment).toBe(true);
  });
});
