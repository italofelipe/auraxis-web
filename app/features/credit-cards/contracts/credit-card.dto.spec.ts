import { describe, expect, it } from "vitest";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import {
  toCreditCardBill,
  toCreditCardUtilization,
} from "./credit-card.dto";

const RAW_CYCLE = {
  start_date: "2026-06-01",
  end_date: "2026-06-30",
  due_date: "2026-07-10",
  status: "open",
};

describe("toCreditCardBill", () => {
  const rawBill = {
    cycle: RAW_CYCLE,
    transactions: [
      {
        id: "t1",
        title: "Mercado",
        amount: "150.50",
        due_date: "2026-06-10",
        status: "paid",
        type: "expense",
      } as unknown as TransactionDto,
    ],
    total_amount: "3250.00",
    paid_amount: "1000.00",
    pending_amount: "2250.00",
  };

  it("coage strings monetárias para number (envelope data)", () => {
    const bill = toCreditCardBill({ data: rawBill });
    expect(bill.totalAmount).toBe(3250);
    expect(bill.paidAmount).toBe(1000);
    expect(bill.pendingAmount).toBe(2250);
    // Bill items preserve the full TransactionDto shape (amount stays a string),
    // so the bill view renders category/notes and edits from /bill alone.
    expect(bill.transactions[0]!.amount).toBe("150.50");
    expect(bill.cycle.status).toBe("open");
  });

  it("mantém compatibilidade com payload flat (legacy)", () => {
    const bill = toCreditCardBill(rawBill);
    expect(bill.totalAmount).toBe(3250);
    expect(bill.transactions).toHaveLength(1);
  });

  it("trata fatura sem transações", () => {
    const bill = toCreditCardBill({ ...rawBill, transactions: [] });
    expect(bill.transactions).toEqual([]);
  });
});

describe("toCreditCardUtilization", () => {
  it("coage amounts e preserva utilization_pct numérico", () => {
    const u = toCreditCardUtilization({
      data: {
        cycle: RAW_CYCLE,
        committed_amount: "3250.00",
        available_amount: "1750.00",
        limit_amount: "5000.00",
        utilization_pct: 65,
      },
    });
    expect(u.committedAmount).toBe(3250);
    expect(u.availableAmount).toBe(1750);
    expect(u.limitAmount).toBe(5000);
    expect(u.utilizationPct).toBe(65);
  });

  it("preserva null em available/limit (cartão sem limite)", () => {
    const u = toCreditCardUtilization({
      cycle: RAW_CYCLE,
      committed_amount: "100.00",
      available_amount: null,
      limit_amount: null,
      utilization_pct: 0,
    });
    expect(u.availableAmount).toBeNull();
    expect(u.limitAmount).toBeNull();
  });
});
