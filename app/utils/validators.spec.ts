import { describe, expect, it } from "vitest";

import { isCNPJ, isCPF, isPhone } from "./validators";

// ---------------------------------------------------------------------------
// isCPF
// ---------------------------------------------------------------------------

describe("isCPF", () => {
  it("aceita CPF válido sem máscara", () => {
    expect(isCPF("52998224725")).toBe(true);
  });

  it("aceita CPF válido com máscara", () => {
    expect(isCPF("529.982.247-25")).toBe(true);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(isCPF("111.111.111-11")).toBe(false);
    expect(isCPF("00000000000")).toBe(false);
  });

  it("rejeita CPF com menos de 11 dígitos", () => {
    expect(isCPF("1234567890")).toBe(false);
  });

  it("rejeita CPF com mais de 11 dígitos", () => {
    expect(isCPF("123456789012")).toBe(false);
  });

  it("rejeita CPF com dígitos verificadores incorretos", () => {
    expect(isCPF("529.982.247-26")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isCPF("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isCNPJ
// ---------------------------------------------------------------------------

describe("isCNPJ", () => {
  it("aceita CNPJ válido sem máscara", () => {
    expect(isCNPJ("11222333000181")).toBe(true);
  });

  it("aceita CNPJ válido com máscara", () => {
    expect(isCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(isCNPJ("00.000.000/0000-00")).toBe(false);
    expect(isCNPJ("11111111111111")).toBe(false);
  });

  it("rejeita CNPJ com menos de 14 dígitos", () => {
    expect(isCNPJ("1122233300018")).toBe(false);
  });

  it("rejeita CNPJ com mais de 14 dígitos", () => {
    expect(isCNPJ("112223330001811")).toBe(false);
  });

  it("rejeita CNPJ com dígitos verificadores incorretos", () => {
    expect(isCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isCNPJ("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isPhone
// ---------------------------------------------------------------------------

describe("isPhone", () => {
  it("aceita celular com 11 dígitos e máscara", () => {
    expect(isPhone("(11) 91234-5678")).toBe(true);
  });

  it("aceita celular sem máscara", () => {
    expect(isPhone("11912345678")).toBe(true);
  });

  it("aceita fixo com 10 dígitos e máscara", () => {
    expect(isPhone("(11) 3456-7890")).toBe(true);
  });

  it("aceita fixo sem máscara", () => {
    expect(isPhone("1134567890")).toBe(true);
  });

  it("rejeita DDD inválido (00)", () => {
    expect(isPhone("00912345678")).toBe(false);
  });

  it("rejeita celular com 3º dígito diferente de 9", () => {
    expect(isPhone("11812345678")).toBe(false);
  });

  it("rejeita número com menos de 10 dígitos", () => {
    expect(isPhone("119123456")).toBe(false);
  });

  it("rejeita número com mais de 11 dígitos", () => {
    expect(isPhone("119123456789")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isPhone("")).toBe(false);
  });
});
