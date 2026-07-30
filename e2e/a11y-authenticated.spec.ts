import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";

import { loginAndVisit, mockAuthenticatedSession } from "./helpers/mock-session";

/**
 * Accessibility gate — telas autenticadas.
 *
 * O gate público (`a11y.spec.ts`) cobre 7 rotas, todas deslogadas. O produto
 * inteiro — dashboard, transações, carteira, metas, orçamentos, simulações —
 * ficava fora do alcance dele, e foi por isso que problemas de a11y relatados
 * pelo PO atravessaram o CI (#1268).
 *
 * Modo: warn-only por padrão. Enquanto não houver baseline limpa, violação
 * vira anotação e o job não reprova. Para promover a bloqueante basta rodar
 * com `A11Y_AUTH_STRICT=1` no workflow.
 */

const STRICT = process.env.A11Y_AUTH_STRICT === "1";

const AUTHENTICATED_PAGES = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/transactions", name: "Transações" },
  { path: "/credit-cards", name: "Cartões" },
  { path: "/portfolio", name: "Carteira" },
  { path: "/goals", name: "Metas" },
  { path: "/budgets", name: "Orçamentos" },
  { path: "/simulations", name: "Simulações" },
];

interface Violation {
  readonly id: string;
  readonly impact: string | null | undefined;
  readonly description: string;
  readonly nodes: ReadonlyArray<{ html: string }>;
}

/**
 * Runs axe on the current page and splits findings by severity.
 *
 * @param page Playwright page already on the screen under test.
 * @returns Blocking and non-blocking violations.
 */
async function auditPage(page: Page): Promise<{
  blocking: Violation[];
  warnings: Violation[];
}> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("[data-nosnippet]")
    .analyze();

  return {
    blocking: results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? "")),
    warnings: results.violations.filter((v) => ["moderate", "minor"].includes(v.impact ?? "")),
  };
}

/**
 * Formats violations for the failure message / annotation body.
 *
 * @param violations Violations to describe.
 * @returns Human-readable block.
 */
function describe(violations: readonly Violation[]): string {
  return violations
    .map((v) => `  [${v.impact}] ${v.id}: ${v.description}\n    ${v.nodes.slice(0, 3).map((n) => n.html).join("\n    ")}`)
    .join("\n");
}

/**
 * Records the audit result, failing only in strict mode.
 *
 * @param name Screen name.
 * @param audit Result of {@link auditPage}.
 * @param audit.blocking Critical/serious violations.
 * @param audit.warnings Moderate/minor violations.
 */
function report(name: string, audit: { blocking: Violation[]; warnings: Violation[] }): void {
  if (audit.warnings.length > 0) {
    test.info().annotations.push({
      type: "a11y-warning",
      description: `${audit.warnings.length} moderate/minor em ${name}:\n${describe(audit.warnings)}`,
    });
  }

  if (audit.blocking.length > 0) {
    test.info().annotations.push({
      type: STRICT ? "a11y-blocking" : "a11y-baseline",
      description: `${audit.blocking.length} critical/serious em ${name}:\n${describe(audit.blocking)}`,
    });
  }

  if (STRICT) {
    expect(
      audit.blocking,
      `${audit.blocking.length} violação(ões) critical/serious em ${name}:\n${describe(audit.blocking)}`,
    ).toHaveLength(0);
  }
}

test.describe("A11y — telas autenticadas", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  for (const { path, name } of AUTHENTICATED_PAGES) {
    test(`${name} (${path})`, async ({ page }) => {
      await loginAndVisit(page, path);
      report(name, await auditPage(page));
    });
  }

  test("Metas — formulário aberto", async ({ page }) => {
    // Bug de a11y quase sempre mora num estado, não no primeiro paint: um
    // diálogo sem rótulo ou sem foco só aparece depois de abri-lo.
    await loginAndVisit(page, "/goals");

    const trigger = page.getByRole("button", { name: /nova meta|criar meta/i }).first();
    if (await trigger.count() === 0) {
      test.skip(true, "CTA de nova meta ausente nesta build"); // reason: estado opcional, não regressão
      return;
    }

    await trigger.click();
    await page.waitForTimeout(500);
    report("Metas (formulário aberto)", await auditPage(page));
  });
});
