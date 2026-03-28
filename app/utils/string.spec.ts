import { describe, expect, it } from "vitest";

import { capitalize, truncate } from "./string";

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------

describe("truncate", () => {
  it("retorna o texto original quando está dentro do limite", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("retorna o texto original quando tem exatamente o tamanho máximo", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("trunca e adiciona sufixo padrão '…'", () => {
    // maxLength=7, suffix "…" (1 char): 6 chars from source + "…" = 7 total
    expect(truncate("Hello World", 7)).toBe("Hello …");
  });

  it("usa sufixo personalizado", () => {
    expect(truncate("Long text here", 8, "...")).toBe("Long ..." );
  });

  it("retorna string vazia para texto vazio", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("o resultado nunca excede maxLength", () => {
    const result = truncate("Texto muito longo", 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// capitalize
// ---------------------------------------------------------------------------

describe("capitalize", () => {
  it("capitaliza a primeira letra", () => {
    expect(capitalize("hello world")).toBe("Hello world");
  });

  it("não altera o restante da string", () => {
    expect(capitalize("hELLO WORLD")).toBe("HELLO WORLD");
  });

  it("retorna string vazia para entrada vazia", () => {
    expect(capitalize("")).toBe("");
  });

  it("funciona com string de um único caractere", () => {
    expect(capitalize("a")).toBe("A");
  });

  it("não altera string já capitalizada", () => {
    expect(capitalize("Already")).toBe("Already");
  });
});
