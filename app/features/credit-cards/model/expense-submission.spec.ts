import { describe, expect, it } from "vitest";

import { type ExpenseFormValues, buildExpensePayloads } from "./expense-submission";

const base: ExpenseFormValues = {
  title: "MacBook",
  amount: 1200,
  purchaseDate: "2026-06-19",
  creditCardId: null,
  tagId: null,
  accountId: null,
  status: "pending",
  impactPolicy: "full",
  mode: "avista",
  installments: 1,
  hasDownPayment: false,
  downPayment: 0,
  description: "",
};

describe("buildExpensePayloads", () => {
  it("creates a single à vista payload (card optional → null allowed)", () => {
    const payloads = buildExpensePayloads(base);
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      title: "MacBook",
      amount: "1200.00",
      type: "expense",
      due_date: "2026-06-19",
      credit_card_id: null,
      is_installment: false,
      impact_policy: "full",
    });
  });

  it("creates a single installment payload when parcelado without entry", () => {
    const payloads = buildExpensePayloads({ ...base, mode: "parcelado", installments: 3 });
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({
      amount: "1200.00",
      is_installment: true,
      installment_count: 3,
    });
  });

  it("splits into an entry + installment plan when a down payment is given", () => {
    const payloads = buildExpensePayloads({
      ...base, mode: "parcelado", installments: 3, hasDownPayment: true, downPayment: 300,
    });
    expect(payloads).toHaveLength(2);
    expect(payloads[0]).toMatchObject({ amount: "300.00", is_installment: false });
    expect(payloads[1]).toMatchObject({ amount: "900.00", is_installment: true, installment_count: 3 });
  });

  it("emits only the entry when the down payment equals the total", () => {
    const payloads = buildExpensePayloads({
      ...base, mode: "parcelado", installments: 3, hasDownPayment: true, downPayment: 1200,
    });
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({ amount: "1200.00", is_installment: false });
  });

  it("forwards card, tag, account and description when present", () => {
    const payloads = buildExpensePayloads({
      ...base, creditCardId: "cc-1", tagId: "t-1", accountId: "a-1", description: "  nota  ",
    });
    expect(payloads[0]).toMatchObject({
      credit_card_id: "cc-1",
      tag_id: "t-1",
      account_id: "a-1",
      description: "nota",
    });
  });
});
