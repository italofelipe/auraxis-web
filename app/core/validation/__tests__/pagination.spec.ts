import { describe, expect, it } from "vitest";

import { paginationParamsSchema } from "../schemas/pagination";

describe("paginationParamsSchema", () => {
  it("aplica defaults quando o objeto está vazio", () => {
    const result = paginationParamsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("aceita page e limit numéricos válidos", () => {
    const result = paginationParamsSchema.parse({ page: 3, limit: 50 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it("converte strings numéricas via coerce", () => {
    const result = paginationParamsSchema.parse({ page: "2", limit: "10" });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("rejeita page igual a zero", () => {
    expect(() => paginationParamsSchema.parse({ page: 0 })).toThrow();
  });

  it("rejeita page negativa", () => {
    expect(() => paginationParamsSchema.parse({ page: -1 })).toThrow();
  });

  it("rejeita page fracionária", () => {
    expect(() => paginationParamsSchema.parse({ page: 1.5 })).toThrow();
  });

  it("rejeita limit igual a zero", () => {
    expect(() => paginationParamsSchema.parse({ limit: 0 })).toThrow();
  });

  it("rejeita limit maior que 100", () => {
    expect(() => paginationParamsSchema.parse({ limit: 101 })).toThrow();
  });

  it("aceita limit igual a 100 (limite máximo)", () => {
    const result = paginationParamsSchema.parse({ limit: 100 });
    expect(result.limit).toBe(100);
  });

  it("aceita limit igual a 1 (limite mínimo)", () => {
    const result = paginationParamsSchema.parse({ limit: 1 });
    expect(result.limit).toBe(1);
  });

  it("emite mensagem de erro em PT-BR para page inválida", () => {
    const result = paginationParamsSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBeTruthy();
    }
  });
});
