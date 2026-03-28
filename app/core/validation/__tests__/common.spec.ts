import { describe, expect, it } from "vitest";

import {
  cnpjSchema,
  cpfSchema,
  currencySchema,
  dateSchema,
  phoneSchema,
} from "../schemas/common";

// ---------------------------------------------------------------------------
// cpfSchema
// ---------------------------------------------------------------------------

describe("cpfSchema", () => {
  it("aceita CPF válido com máscara", () => {
    expect(() => cpfSchema.parse("529.982.247-25")).not.toThrow();
  });

  it("aceita CPF válido sem máscara", () => {
    expect(() => cpfSchema.parse("52998224725")).not.toThrow();
  });

  it("rejeita string vazia", () => {
    expect(() => cpfSchema.parse("")).toThrow();
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(() => cpfSchema.parse("111.111.111-11")).toThrow();
  });

  it("rejeita CPF com dígitos verificadores incorretos", () => {
    expect(() => cpfSchema.parse("529.982.247-26")).toThrow();
  });

  it("emite mensagem de erro personalizada em PT-BR", () => {
    const result = cpfSchema.safeParse("12345678900");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("CPF");
    }
  });
});

// ---------------------------------------------------------------------------
// cnpjSchema
// ---------------------------------------------------------------------------

describe("cnpjSchema", () => {
  it("aceita CNPJ válido com máscara", () => {
    expect(() => cnpjSchema.parse("11.222.333/0001-81")).not.toThrow();
  });

  it("aceita CNPJ válido sem máscara", () => {
    expect(() => cnpjSchema.parse("11222333000181")).not.toThrow();
  });

  it("rejeita string vazia", () => {
    expect(() => cnpjSchema.parse("")).toThrow();
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(() => cnpjSchema.parse("00.000.000/0000-00")).toThrow();
  });

  it("emite mensagem de erro personalizada em PT-BR", () => {
    const result = cnpjSchema.safeParse("00000000000000");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("CNPJ");
    }
  });
});

// ---------------------------------------------------------------------------
// phoneSchema
// ---------------------------------------------------------------------------

describe("phoneSchema", () => {
  it("aceita celular com máscara", () => {
    expect(() => phoneSchema.parse("(11) 91234-5678")).not.toThrow();
  });

  it("aceita fixo com máscara", () => {
    expect(() => phoneSchema.parse("(11) 3456-7890")).not.toThrow();
  });

  it("rejeita string vazia", () => {
    expect(() => phoneSchema.parse("")).toThrow();
  });

  it("rejeita número com DDD inválido", () => {
    expect(() => phoneSchema.parse("00912345678")).toThrow();
  });

  it("emite mensagem de erro personalizada em PT-BR", () => {
    const result = phoneSchema.safeParse("00912345678");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("telefone");
    }
  });
});

// ---------------------------------------------------------------------------
// currencySchema
// ---------------------------------------------------------------------------

describe("currencySchema", () => {
  it("aceita número positivo", () => {
    expect(currencySchema.parse(1234.56)).toBe(1234.56);
  });

  it("aceita zero", () => {
    expect(currencySchema.parse(0)).toBe(0);
  });

  it("aceita string numérica via coerce", () => {
    expect(currencySchema.parse("50")).toBe(50);
  });

  it("rejeita valor negativo", () => {
    expect(() => currencySchema.parse(-1)).toThrow();
  });

  it("rejeita string não numérica", () => {
    expect(() => currencySchema.parse("abc")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// dateSchema
// ---------------------------------------------------------------------------

describe("dateSchema", () => {
  it("aceita data no formato YYYY-MM-DD", () => {
    expect(() => dateSchema.parse("2026-03-28")).not.toThrow();
  });

  it("rejeita data no formato dd/mm/yyyy", () => {
    expect(() => dateSchema.parse("28/03/2026")).toThrow();
  });

  it("rejeita string vazia", () => {
    expect(() => dateSchema.parse("")).toThrow();
  });

  it("rejeita formato ISO completo com hora", () => {
    expect(() => dateSchema.parse("2026-03-28T12:00:00.000Z")).toThrow();
  });

  it("emite mensagem de erro personalizada em PT-BR", () => {
    const result = dateSchema.safeParse("28/03/2026");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBeTruthy();
    }
  });
});
