import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/index.vue"), "utf8");

describe("app home page — product-first login copy", () => {
  it("uses a clear finance-focused hero instead of generic analytics copy", () => {
    expect(source).toContain("Organize suas finanças com clareza.");
    expect(source).toContain("acompanhar seu mês, revisar movimentações, cumprir metas");
    expect(source).not.toContain("Volte ao seu painel de analytics em segundos");
  });

  it("keeps account creation and recovery actions visible from the app home", () => {
    expect(source).toContain("Criar conta gratuita");
    expect(source).toContain("Recuperar acesso");
  });

  it("shows a product preview with finance signals before login", () => {
    expect(source).toContain("Prévia do painel financeiro Auraxis");
    expect(source).toContain("Saldo previsto");
    expect(source).toContain("Insight recente");
    expect(source).toContain("Dados protegidos");
  });
});
