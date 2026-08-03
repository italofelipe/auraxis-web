import fs from "node:fs";
import path from "node:path";

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

/**
 * `pnpm test:e2e` roda todo `e2e/**\/*.spec.ts`, e o job E2E é bloqueante.
 * Este gate é warn-only e mede telas logadas: sem esta porta ele entraria no
 * job errado e reprovaria PR por dívida de a11y que ainda nem tem baseline.
 * O job A11y Gate liga a env.
 */
const ENABLED = process.env.A11Y_AUTH_GATE === "1";

/**
 * Onde a baseline é gravada. Fora de `playwright-report/` de propósito: aquela
 * pasta pertence ao reporter HTML e é reescrita a cada execução — o arquivo
 * cairia junto do relatório do gate público, que roda antes neste mesmo job.
 */
const BASELINE_DIR = path.resolve(
  process.env.A11Y_BASELINE_DIR ?? "a11y-baseline",
);
const BASELINE_FILE = path.join(BASELINE_DIR, "a11y-authenticated-baseline.json");

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

/** Uma tela auditada, no formato que vai para o JSON da baseline. */
interface BaselineEntry {
  readonly screen: string;
  readonly blockingCount: number;
  readonly warningCount: number;
  readonly blocking: readonly SerializedViolation[];
  readonly warnings: readonly SerializedViolation[];
}

interface SerializedViolation {
  readonly id: string;
  readonly impact: string | null;
  readonly description: string;
  readonly nodeCount: number;
  readonly sampleNodes: readonly string[];
}

/**
 * Reduz a violação do axe ao que serve para abrir uma issue.
 *
 * O objeto cru traz o resultado de cada checagem em cada nó e vira megabytes
 * de JSON — um artefato que ninguém abre não registra baseline nenhuma.
 *
 * @param violation Violação como o axe devolve.
 * @returns Violação enxuta.
 */
function serialize(violation: Violation): SerializedViolation {
  return {
    id: violation.id,
    impact: violation.impact ?? null,
    description: violation.description,
    nodeCount: violation.nodes.length,
    sampleNodes: violation.nodes.slice(0, 5).map((node) => node.html),
  };
}

/**
 * Grava o resultado de uma tela como um arquivo próprio.
 *
 * Um arquivo por tela porque o job roda em paralelo (`workers: 50%` no CI) e
 * dois processos escrevendo o mesmo JSON se sobrescreveriam. A consolidação
 * acontece no `afterAll`.
 *
 * @param entry Resultado da tela auditada.
 */
function writeShard(entry: BaselineEntry): void {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
  const slug = entry.screen
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  fs.writeFileSync(
    path.join(BASELINE_DIR, `screen-${slug}.json`),
    JSON.stringify(entry, null, 2),
  );
}

/**
 * Junta os arquivos por tela num único JSON de baseline.
 *
 * Roda no `afterAll` de cada worker; o último a terminar enxerga todos os
 * arquivos, então o consolidado final é completo. A ordenação por nome de tela
 * mantém o diff estável entre execuções.
 *
 * @returns Baseline consolidada, ou null quando nada foi auditado.
 */
function mergeShards(): { screens: BaselineEntry[]; totals: Record<string, number> } | null {
  if (!fs.existsSync(BASELINE_DIR)) {
    return null;
  }

  const screens = fs
    .readdirSync(BASELINE_DIR)
    .filter((file) => file.startsWith("screen-") && file.endsWith(".json"))
    .map(
      (file) =>
        JSON.parse(
          fs.readFileSync(path.join(BASELINE_DIR, file), "utf8"),
        ) as BaselineEntry,
    )
    .sort((a, b) => a.screen.localeCompare(b.screen));

  if (screens.length === 0) {
    return null;
  }

  return {
    screens,
    totals: {
      screens: screens.length,
      blocking: screens.reduce((sum, entry) => sum + entry.blockingCount, 0),
      warnings: screens.reduce((sum, entry) => sum + entry.warningCount, 0),
    },
  };
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
  // Antes as violações só viravam anotação, e anotação não sai do processo: o
  // reporter do CI não a imprime e o artefato não a contém. O gate auditava e
  // jogava fora o que encontrou (#1284). Agora o achado sai por dois canais —
  // arquivo (artefato) e stdout (log do job) — e a anotação vira redundância
  // barata, não a única cópia.
  writeShard({
    screen: name,
    blockingCount: audit.blocking.length,
    warningCount: audit.warnings.length,
    blocking: audit.blocking.map(serialize),
    warnings: audit.warnings.map(serialize),
  });

  if (audit.blocking.length > 0 || audit.warnings.length > 0) {
    console.log(
      `\n[a11y-baseline] ${name} — ${audit.blocking.length} critical/serious, ${audit.warnings.length} moderate/minor`
      + (audit.blocking.length > 0 ? `\n${describe(audit.blocking)}` : "")
      + (audit.warnings.length > 0 ? `\n${describe(audit.warnings)}` : ""),
    );
  } else {
    console.log(`\n[a11y-baseline] ${name} — sem violações`);
  }

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
  // reason: porta de execução do gate, não teste desabilitado — ver ENABLED acima.
  test.skip(!ENABLED, "gate de a11y autenticado roda só com A11Y_AUTH_GATE=1");

  test.beforeEach(async ({ page }) => {
    await mockAuthenticatedSession(page);
  });

  test.afterAll(() => {
    const baseline = mergeShards();

    if (!baseline) {
      return;
    }

    fs.writeFileSync(
      BASELINE_FILE,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          strict: STRICT,
          ...baseline,
        },
        null,
        2,
      ),
    );
    console.log(
      `\n[a11y-baseline] consolidado em ${BASELINE_FILE}: `
      + `${baseline.totals.screens} tela(s), ${baseline.totals.blocking} critical/serious, `
      + `${baseline.totals.warnings} moderate/minor`,
    );
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
