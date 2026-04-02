import { describe, expect, it } from "vitest";
import {
  CURRENCY_PAIRS,
  calculateConversorMoeda,
  createDefaultConversorMoedaFormState,
  validateConversorMoedaForm,
  type ConversorMoedaFormState,
} from "./conversor-moeda";
import type { BrapiCurrencyResult } from "~/features/tools/services/brapi-tools.client";

// ─── Test helpers ─────────────────────────────────────────────────────────────

const mockQuote: BrapiCurrencyResult = {
  fromCurrency: "USD",
  toCurrency: "BRL",
  name: "Dólar Americano",
  high: 5.10,
  low: 4.90,
  bid: 5.00,
  ask: 5.05,
  pctChange: 0.5,
  description: "USD/BRL",
};

// ─── createDefaultConversorMoedaFormState ─────────────────────────────────────

describe("createDefaultConversorMoedaFormState", () => {
  it("returns amount as null", () => {
    expect(createDefaultConversorMoedaFormState().amount).toBeNull();
  });

  it("returns default pair as USD-BRL", () => {
    expect(createDefaultConversorMoedaFormState().pair).toBe("USD-BRL");
  });

  it("returns default direction as buy", () => {
    expect(createDefaultConversorMoedaFormState().direction).toBe("buy");
  });

  it("returns manualRate as null", () => {
    expect(createDefaultConversorMoedaFormState().manualRate).toBeNull();
  });
});

// ─── CURRENCY_PAIRS ───────────────────────────────────────────────────────────

describe("CURRENCY_PAIRS", () => {
  it("includes USD-BRL", () => {
    expect(CURRENCY_PAIRS).toContain("USD-BRL");
  });

  it("includes BTC-BRL", () => {
    expect(CURRENCY_PAIRS).toContain("BTC-BRL");
  });

  it("has 9 pairs", () => {
    expect(CURRENCY_PAIRS).toHaveLength(9);
  });
});

// ─── validateConversorMoedaForm ───────────────────────────────────────────────

describe("validateConversorMoedaForm", () => {
  it("returns no errors for valid form with BRAPI quote", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    expect(validateConversorMoedaForm(form, true)).toHaveLength(0);
  });

  it("returns no errors for valid form with manual rate and no BRAPI", () => {
    const form: ConversorMoedaFormState = {
      amount: 500,
      pair: "EUR-BRL",
      direction: "sell",
      manualRate: 5.50,
    };
    expect(validateConversorMoedaForm(form, false)).toHaveLength(0);
  });

  it("returns error when amount is null", () => {
    const form: ConversorMoedaFormState = {
      amount: null,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const errors = validateConversorMoedaForm(form, true);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("returns error when amount is zero", () => {
    const form: ConversorMoedaFormState = {
      amount: 0,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const errors = validateConversorMoedaForm(form, true);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("returns error when amount is negative", () => {
    const form: ConversorMoedaFormState = {
      amount: -100,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const errors = validateConversorMoedaForm(form, true);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("returns rateRequired error when no BRAPI and manualRate is null", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const errors = validateConversorMoedaForm(form, false);
    expect(errors.some((e) => e.messageKey === "errors.rateRequired")).toBe(true);
  });

  it("returns rateRequired error when no BRAPI and manualRate is zero", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: 0,
    };
    const errors = validateConversorMoedaForm(form, false);
    expect(errors.some((e) => e.field === "manualRate")).toBe(true);
  });

  it("does not return rateRequired when BRAPI quote is available even with null manualRate", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const errors = validateConversorMoedaForm(form, true);
    expect(errors.some((e) => e.field === "manualRate")).toBe(false);
  });
});

// ─── calculateConversorMoeda — direction "buy" ────────────────────────────────

describe("calculateConversorMoeda — direction buy (BRL → foreign)", () => {
  it("uses ask rate and divides amount by ask when buying", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, mockQuote);

    // 1000 BRL / 5.05 ask = ~198.02 USD
    expect(result.rate).toBe(5.05);
    expect(result.convertedAmount).toBeCloseTo(1000 / 5.05, 4);
  });

  it("sets source to brapi when quote provided", () => {
    const form: ConversorMoedaFormState = {
      amount: 500,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, mockQuote);
    expect(result.source).toBe("brapi");
  });

  it("sets fromCurrency to BRL and toCurrency to USD on buy", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, mockQuote);
    expect(result.fromCurrency).toBe("BRL");
    expect(result.toCurrency).toBe("USD");
  });

  it("includes pctChange from the quote", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, mockQuote);
    expect(result.pctChange).toBe(0.5);
  });
});

// ─── calculateConversorMoeda — direction "sell" ───────────────────────────────

describe("calculateConversorMoeda — direction sell (foreign → BRL)", () => {
  it("uses bid rate and multiplies amount by bid when selling", () => {
    const form: ConversorMoedaFormState = {
      amount: 100,
      pair: "USD-BRL",
      direction: "sell",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, mockQuote);

    // 100 USD * 5.00 bid = 500 BRL
    expect(result.rate).toBe(5.00);
    expect(result.convertedAmount).toBeCloseTo(500, 4);
  });

  it("sets fromCurrency to USD and toCurrency to BRL on sell", () => {
    const form: ConversorMoedaFormState = {
      amount: 100,
      pair: "USD-BRL",
      direction: "sell",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, mockQuote);
    expect(result.fromCurrency).toBe("USD");
    expect(result.toCurrency).toBe("BRL");
  });
});

// ─── calculateConversorMoeda — manual rate fallback ───────────────────────────

describe("calculateConversorMoeda — manual rate fallback", () => {
  it("uses manual rate when no BRAPI quote and source is manual", () => {
    const form: ConversorMoedaFormState = {
      amount: 1000,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: 5.20,
    };
    const result = calculateConversorMoeda(form, null);

    expect(result.source).toBe("manual");
    expect(result.rate).toBe(5.20);
    expect(result.convertedAmount).toBeCloseTo(1000 / 5.20, 4);
  });

  it("manual sell uses rate to multiply amount", () => {
    const form: ConversorMoedaFormState = {
      amount: 200,
      pair: "EUR-BRL",
      direction: "sell",
      manualRate: 5.55,
    };
    const result = calculateConversorMoeda(form, null);

    expect(result.convertedAmount).toBeCloseTo(200 * 5.55, 4);
  });

  it("returns pctChange of 0 in manual mode", () => {
    const form: ConversorMoedaFormState = {
      amount: 100,
      pair: "USD-BRL",
      direction: "buy",
      manualRate: 5.00,
    };
    const result = calculateConversorMoeda(form, null);
    expect(result.pctChange).toBe(0);
  });
});

// ─── calculateConversorMoeda — other pairs ────────────────────────────────────

describe("calculateConversorMoeda — EUR-BRL pair", () => {
  it("parses EUR-BRL pair correctly on sell", () => {
    const eurQuote: BrapiCurrencyResult = {
      fromCurrency: "EUR",
      toCurrency: "BRL",
      name: "Euro",
      high: 5.70,
      low: 5.50,
      bid: 5.55,
      ask: 5.65,
      pctChange: -0.3,
      description: "EUR/BRL",
    };
    const form: ConversorMoedaFormState = {
      amount: 100,
      pair: "EUR-BRL",
      direction: "sell",
      manualRate: null,
    };
    const result = calculateConversorMoeda(form, eurQuote);

    expect(result.fromCurrency).toBe("EUR");
    expect(result.toCurrency).toBe("BRL");
    expect(result.convertedAmount).toBeCloseTo(100 * 5.55, 4);
  });
});
