import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reads a source file relative to the project root.
 *
 * @param path Source file path.
 * @returns File content as UTF-8 text.
 */
const readSource = (path: string): string => readFileSync(join(process.cwd(), path), "utf8");

describe("financial money input adoption", () => {
  it("uses the canonical money input in transaction create and edit forms", () => {
    expect(readSource("app/components/transactions/QuickTransactionForm/QuickTransactionFormFields.vue"))
      .toContain("<UiMoneyInput");
    expect(readSource("app/components/transactions/EditTransactionModal/EditTransactionModal.vue"))
      .toContain("<UiMoneyInput");
  });

  it("uses the canonical money input in goals and budgets", () => {
    expect(readSource("app/components/goal/GoalForm/GoalForm.vue")).toContain("<UiMoneyInput");
    expect(readSource("app/components/goal/GoalSimulatePanel/GoalSimulatePanel.vue"))
      .toContain("<UiMoneyInput");
    expect(readSource("app/pages/budgets.vue")).toContain("<UiMoneyInput");
  });

  it("uses the canonical money input in credit cards and wallet", () => {
    // cc-4 (#864): o form de cartão foi extraído da página para CreditCardForm.vue.
    expect(readSource("app/features/credit-cards/components/CreditCardForm.vue"))
      .toContain("<UiMoneyInput");
    expect(readSource("app/components/wallet/WalletEntryForm/WalletEntryFormFields.vue"))
      .toContain("<UiMoneyInput");
  });
});
