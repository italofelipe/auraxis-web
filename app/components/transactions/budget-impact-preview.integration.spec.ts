import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Reads a repository source file for integration assertions.
 *
 * @param path Relative source path.
 * @returns UTF-8 file contents.
 */
const readSource = (path: string): string => readFileSync(join(process.cwd(), path), "utf8");

describe("transaction budget impact preview integration", () => {
  it("wires budget impact preview into quick and edit transaction forms", () => {
    expect(readSource("app/components/transactions/QuickTransactionForm/useQuickTransactionForm.ts"))
      .toContain("buildBudgetImpactPreview");
    expect(readSource("app/components/transactions/QuickTransactionForm/QuickTransactionFormFields.vue"))
      .toContain("budgetImpactPreview");
    expect(readSource("app/components/transactions/EditTransactionModal/EditTransactionModal.vue"))
      .toContain("buildBudgetImpactPreview");
  });

  it("keeps transactions free from a direct budget_id payload field", () => {
    const dto = readSource("app/features/transactions/contracts/transaction.dto.ts");
    const quickForm = readSource("app/components/transactions/QuickTransactionForm/useQuickTransactionForm.ts");
    const editModal = readSource("app/components/transactions/EditTransactionModal/EditTransactionModal.vue");

    expect(dto).not.toContain("budget_id");
    expect(quickForm).not.toContain("budget_id");
    expect(editModal).not.toContain("budget_id");
  });
});
