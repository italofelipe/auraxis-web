import { describe, expect, it } from "vitest";
import {
  cnpjSchema,
  cpfSchema,
  createCnpjSchema,
  createCpfSchema,
  createCurrencySchema,
  createIsoDateSchema,
  createPhoneSchema,
  currencySchema,
  isoDateSchema,
  paginationSchema,
  phoneSchema,
} from "./validators";

/**
 * Stub translation function — returns the key itself so we can assert on it.
 *
 * @param key - i18n key.
 * @returns The key unchanged.
 */
const t = (key: string): string => key;

// ── CPF ───────────────────────────────────────────────────────────────────

/**
 * Tests for createCpfSchema factory.
 */
describe("createCpfSchema", () => {
  const schema = createCpfSchema(t);

  it("accepts a valid CPF without formatting", () => {
    const result = schema.safeParse("52998224725");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("52998224725");
    }
  });

  it("accepts a valid CPF with formatting and strips mask", () => {
    const result = schema.safeParse("529.982.247-25");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("52998224725");
    }
  });

  it("rejects a CPF with wrong check digits", () => {
    const result = schema.safeParse("529.982.247-26");
    expect(result.success).toBe(false);
  });

  it("rejects all-same-digit CPF (111.111.111-11)", () => {
    const result = schema.safeParse("111.111.111-11");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string with required message", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.cpf.required");
    }
  });

  it("rejects a CPF with wrong digit count", () => {
    const result = schema.safeParse("1234567");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.cpf.format");
    }
  });
});

// ── CNPJ ──────────────────────────────────────────────────────────────────

/**
 * Tests for createCnpjSchema factory.
 */
describe("createCnpjSchema", () => {
  const schema = createCnpjSchema(t);

  it("accepts a valid CNPJ without formatting", () => {
    const result = schema.safeParse("11222333000181");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11222333000181");
    }
  });

  it("accepts a valid CNPJ with formatting and strips mask", () => {
    const result = schema.safeParse("11.222.333/0001-81");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11222333000181");
    }
  });

  it("rejects a CNPJ with wrong check digits", () => {
    const result = schema.safeParse("11.222.333/0001-82");
    expect(result.success).toBe(false);
  });

  it("rejects all-same-digit CNPJ (11111111111111)", () => {
    const result = schema.safeParse("11111111111111");
    expect(result.success).toBe(false);
  });

  it("rejects a CNPJ that is too short", () => {
    const result = schema.safeParse("1122233300018");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.cnpj.format");
    }
  });

  it("rejects an empty string with required message", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.cnpj.required");
    }
  });
});

// ── Phone ─────────────────────────────────────────────────────────────────

/**
 * Tests for createPhoneSchema factory.
 */
describe("createPhoneSchema", () => {
  const schema = createPhoneSchema(t);

  it("accepts a valid mobile number (11 digits)", () => {
    const result = schema.safeParse("11999999999");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11999999999");
    }
  });

  it("accepts a valid landline number (10 digits)", () => {
    const result = schema.safeParse("1133334444");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("1133334444");
    }
  });

  it("accepts formatted mobile and strips mask", () => {
    const result = schema.safeParse("(11) 99999-9999");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11999999999");
    }
  });

  it("rejects a number with invalid digit count", () => {
    const result = schema.safeParse("123456789");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.phone.invalid");
    }
  });

  it("rejects an empty string with required message", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.phone.required");
    }
  });
});

// ── Currency ──────────────────────────────────────────────────────────────

/**
 * Tests for createCurrencySchema factory.
 */
describe("createCurrencySchema", () => {
  const schema = createCurrencySchema(t);

  it("accepts a positive number", () => {
    const result = schema.safeParse(1500.5);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(1500.5);
    }
  });

  it("accepts zero", () => {
    const result = schema.safeParse(0);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(0);
    }
  });

  it("accepts a numeric string", () => {
    const result = schema.safeParse("250.75");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(250.75);
    }
  });

  it("accepts a numeric string with comma as decimal separator", () => {
    const result = schema.safeParse("1250,75");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(1250.75);
    }
  });

  it("rejects a negative number", () => {
    const result = schema.safeParse(-100);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.currency.negative");
    }
  });

  it("rejects a non-numeric string", () => {
    const result = schema.safeParse("abc");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string with required message", () => {
    const result = schema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.currency.required");
    }
  });
});

// ── ISO Date ──────────────────────────────────────────────────────────────

/**
 * Tests for createIsoDateSchema factory.
 */
describe("createIsoDateSchema", () => {
  const schema = createIsoDateSchema(t);

  it("accepts a valid ISO date", () => {
    const result = schema.safeParse("2024-06-15");
    expect(result.success).toBe(true);
  });

  it("rejects a date in DD/MM/YYYY format", () => {
    const result = schema.safeParse("15/06/2024");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("validation.isoDate.format");
    }
  });

  it("rejects month 00", () => {
    const result = schema.safeParse("2024-00-15");
    expect(result.success).toBe(false);
  });

  it("rejects month 13", () => {
    const result = schema.safeParse("2024-13-15");
    expect(result.success).toBe(false);
  });

  it("rejects day 00", () => {
    const result = schema.safeParse("2024-06-00");
    expect(result.success).toBe(false);
  });

  it("rejects day 32", () => {
    const result = schema.safeParse("2024-06-32");
    expect(result.success).toBe(false);
  });
});

// ── Pagination ────────────────────────────────────────────────────────────

/**
 * Tests for paginationSchema.
 */
describe("paginationSchema", () => {
  it("accepts page=1 and limit=10", () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 10 });
    expect(result.success).toBe(true);
  });

  it("rejects page=0", () => {
    const result = paginationSchema.safeParse({ page: 0, limit: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects limit=101", () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer page", () => {
    const result = paginationSchema.safeParse({ page: 1.5, limit: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer limit", () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 10.5 });
    expect(result.success).toBe(false);
  });

  it("accepts boundary values: page=1 limit=100", () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 100 });
    expect(result.success).toBe(true);
  });
});

// ── Static fallback schemas (PT-BR hardcoded) ─────────────────────────────

/**
 * Tests for the static PT-BR cpfSchema fallback.
 */
describe("cpfSchema (static fallback)", () => {
  it("happy path — valid CPF parses to digits-only", () => {
    const result = cpfSchema.safeParse("529.982.247-25");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("52998224725");
    }
  });

  it("rejection returns PT-BR message", () => {
    const result = cpfSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("Informe o CPF.");
    }
  });
});

/**
 * Tests for the static PT-BR cnpjSchema fallback.
 */
describe("cnpjSchema (static fallback)", () => {
  it("happy path — valid CNPJ parses to digits-only", () => {
    const result = cnpjSchema.safeParse("11.222.333/0001-81");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11222333000181");
    }
  });

  it("rejection returns PT-BR message", () => {
    const result = cnpjSchema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("Informe o CNPJ.");
    }
  });
});

/**
 * Tests for the static PT-BR phoneSchema fallback.
 */
describe("phoneSchema (static fallback)", () => {
  it("happy path — valid phone parses to digits-only", () => {
    const result = phoneSchema.safeParse("(11) 99999-9999");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("11999999999");
    }
  });

  it("rejection returns PT-BR message", () => {
    const result = phoneSchema.safeParse("123");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe(
        "Telefone inválido. Use (11) 99999-9999 ou (11) 9999-9999.",
      );
    }
  });
});

/**
 * Tests for the static PT-BR currencySchema fallback.
 */
describe("currencySchema (static fallback)", () => {
  it("happy path — positive number accepted", () => {
    const result = currencySchema.safeParse(100);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(100);
    }
  });

  it("rejection returns PT-BR message for negative value", () => {
    const result = currencySchema.safeParse(-1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe("O valor não pode ser negativo.");
    }
  });
});

/**
 * Tests for the static PT-BR isoDateSchema fallback.
 */
describe("isoDateSchema (static fallback)", () => {
  it("happy path — valid ISO date accepted", () => {
    const result = isoDateSchema.safeParse("2024-01-01");
    expect(result.success).toBe(true);
  });

  it("rejection returns PT-BR message", () => {
    const result = isoDateSchema.safeParse("01/01/2024");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.at(0)?.message).toBe(
        "Data deve estar no formato AAAA-MM-DD.",
      );
    }
  });
});
