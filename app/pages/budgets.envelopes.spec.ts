import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Reads a repository source file for copy and positioning assertions.
 *
 * @param relativePath Relative source path.
 * @returns UTF-8 file contents.
 */
const readSource = (relativePath: string): string =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("budgets page envelope positioning", () => {
  it("positions budgets as automatic monthly envelopes with concrete examples", () => {
    const source = readSource("app/pages/budgets.vue");

    expect(source).toContain("envelopes automáticos");
    expect(source).toContain("Streaming");
    expect(source).toContain("Mercado");
    expect(source).toContain("Transporte");
    expect(source).toContain("Comprometido");
  });
});
