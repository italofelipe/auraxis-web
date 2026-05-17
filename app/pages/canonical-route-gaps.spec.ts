import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");

/**
 * Reads a repository file from the current test worktree.
 *
 * @param path Relative path from the repository root.
 * @returns UTF-8 file contents.
 */
function readProjectFile(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("canonical route gaps", () => {
  it("adds the canonical Market Pulse about-us route", () => {
    const path = "app/pages/about-us.vue";

    expect(existsSync(resolve(root, path))).toBe(true);

    const source = readProjectFile(path);
    expect(source).toContain("about-us-page");
    expect(source).toContain("layout: \"public\"");
    expect(source).toContain("Auraxis:");
    expect(source).toContain("Inteligência que Transforma Patrimônio");
  });

  it("adds the canonical detailed-quarter-result route from the blue dashboard design", () => {
    const path = "app/pages/tools/detailed-quarter-result.vue";

    expect(existsSync(resolve(root, path))).toBe(true);

    const source = readProjectFile(path);
    expect(source).toContain("detailed-quarter-page");
    expect(source).toContain("Resultado Trimestral Detalhado");
    expect(source).toContain("Insights Automáticos");
  });

  it("documents misnamed prototype files instead of wiring incorrect routes", () => {
    const docPath = "docs/review-assets/826-canonical-route-gaps/route-design-decisions.md";

    expect(existsSync(resolve(root, docPath))).toBe(true);

    const source = readProjectFile(docPath);
    expect(source).toContain("/changelog");
    expect(source).toContain("sem design canonico proprio");
    expect(source).toContain("tools_restaurant_bill_calculator_page.html");
    expect(source).toContain("nao usar para `/tools/dividir-conta`");
    expect(source).toContain("tools_home_page.html");
    expect(source).toContain("nao usar para `/tools`");
  });
});
