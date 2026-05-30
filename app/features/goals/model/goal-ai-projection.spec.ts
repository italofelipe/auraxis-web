import { describe, expect, it } from "vitest";

import {
  buildGoalAIProjectionContext,
  summarizeGoalAITransactions,
} from "./goal-ai-projection";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

/**
 * Builds a transaction fixture for goal AI projection model tests.
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
  due_date: "2026-05-10",
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

describe("goal AI projection model", () => {
  it("summarizes recent transactions into income, expenses and net flow", () => {
    const summary = summarizeGoalAITransactions([
      makeTransaction({ amount: "5000.00", type: "income" }),
      makeTransaction({ id: "tx-2", amount: "1200.50", type: "expense" }),
      makeTransaction({ id: "tx-3", amount: "300.00", type: "expense" }),
    ]);

    expect(summary).toEqual({
      incomeTotal: 5000,
      expenseTotal: 1500.5,
      netFlow: 3499.5,
      transactionCount: 3,
    });
  });

  it("builds an AI context containing user notes and the 90-day transaction summary", () => {
    const context = buildGoalAIProjectionContext({
      userContext: "Quero manter liquidez e evitar aportes agressivos.",
      recentTransactions: [
        makeTransaction({ amount: "5000.00", type: "income" }),
        makeTransaction({ id: "tx-2", amount: "1800.00", type: "expense" }),
      ],
    });

    expect(context).toContain("Quero manter liquidez");
    expect(context).toContain("Ultimos 90 dias");
    expect(context).toContain("entradas R$ 5.000,00");
    expect(context).toContain("saidas R$ 1.800,00");
    expect(context).toContain("saldo R$ 3.200,00");
  });
});
