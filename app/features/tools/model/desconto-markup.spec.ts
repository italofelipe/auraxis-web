import { describe, expect, it } from "vitest";
import {
  DESCONTO_MARKUP_MODES,
  calculateDescontoMarkup,
  createDefaultDescontoMarkupFormState,
  validateDescontoMarkupForm,
  type DescontoMarkupFormState,
} from "./desconto-markup";

// ─── validateDescontoMarkupForm ───────────────────────────────────────────────

describe("validateDescontoMarkupForm — desconto mode", () => {
  it("returns no errors for valid desconto form", () => {
    const form: DescontoMarkupFormState = {
      mode: "desconto",
      price: 100,
      pct: 20,
      cost: null,
    };
    expect(validateDescontoMarkupForm(form)).toHaveLength(0);
  });

  it("returns error when price is null in desconto mode", () => {
    const form: DescontoMarkupFormState = {
      mode: "desconto",
      price: null,
      pct: 20,
      cost: null,
    };
    const errors = validateDescontoMarkupForm(form);
    expect(errors.some((e) => e.field === "price")).toBe(true);
  });

  it("returns error when pct is null in desconto mode", () => {
    const form: DescontoMarkupFormState = {
      mode: "desconto",
      price: 100,
      pct: null,
      cost: null,
    };
    const errors = validateDescontoMarkupForm(form);
    expect(errors.some((e) => e.field === "pct")).toBe(true);
  });

  it("returns error when pct exceeds 100 in desconto mode", () => {
    const form: DescontoMarkupFormState = {
      mode: "desconto",
      price: 100,
      pct: 110,
      cost: null,
    };
    const errors = validateDescontoMarkupForm(form);
    expect(errors.some((e) => e.field === "pct")).toBe(true);
  });
});

describe("validateDescontoMarkupForm — markup mode", () => {
  it("returns no errors for valid markup form", () => {
    const form: DescontoMarkupFormState = {
      mode: "markup",
      price: null,
      pct: 50,
      cost: 80,
    };
    expect(validateDescontoMarkupForm(form)).toHaveLength(0);
  });

  it("returns error when cost is null in markup mode", () => {
    const form: DescontoMarkupFormState = {
      mode: "markup",
      price: null,
      pct: 30,
      cost: null,
    };
    const errors = validateDescontoMarkupForm(form);
    expect(errors.some((e) => e.field === "cost")).toBe(true);
  });
});

describe("validateDescontoMarkupForm — margem mode", () => {
  it("returns no errors for valid margem form", () => {
    const form: DescontoMarkupFormState = {
      mode: "margem",
      price: 120,
      pct: null,
      cost: 90,
    };
    expect(validateDescontoMarkupForm(form)).toHaveLength(0);
  });

  it("returns error when price is null in margem mode", () => {
    const form: DescontoMarkupFormState = {
      mode: "margem",
      price: null,
      pct: null,
      cost: 90,
    };
    const errors = validateDescontoMarkupForm(form);
    expect(errors.some((e) => e.field === "price")).toBe(true);
  });
});

describe("validateDescontoMarkupForm — reverso mode", () => {
  it("returns no errors for valid reverso form", () => {
    const form: DescontoMarkupFormState = {
      mode: "reverso",
      price: 80,
      pct: 20,
      cost: null,
    };
    expect(validateDescontoMarkupForm(form)).toHaveLength(0);
  });

  it("returns error when pct is 100 in reverso mode (division by zero)", () => {
    const form: DescontoMarkupFormState = {
      mode: "reverso",
      price: 80,
      pct: 100,
      cost: null,
    };
    const errors = validateDescontoMarkupForm(form);
    expect(errors.some((e) => e.field === "pct")).toBe(true);
  });
});

// ─── calculateDescontoMarkup ──────────────────────────────────────────────────

describe("calculateDescontoMarkup — desconto", () => {
  it("computes final price and savings correctly", () => {
    const form: DescontoMarkupFormState = {
      mode: "desconto",
      price: 200,
      pct: 25,
      cost: null,
    };
    const result = calculateDescontoMarkup(form);
    // finalPrice = 200 * 0.75 = 150; savings = 50
    expect(result.calculatedValue).toBeCloseTo(150, 2);
    expect(result.savingsOrProfit).toBeCloseTo(50, 2);
    expect(result.pctResult).toBe(25);
    expect(result.mode).toBe("desconto");
  });

  it("returns full price when discount is 0%", () => {
    const form: DescontoMarkupFormState = {
      mode: "desconto",
      price: 100,
      pct: 0,
      cost: null,
    };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBe(100);
    expect(result.savingsOrProfit).toBe(0);
  });
});

describe("calculateDescontoMarkup — markup", () => {
  it("computes sale price and profit correctly", () => {
    const form: DescontoMarkupFormState = {
      mode: "markup",
      price: null,
      pct: 50,
      cost: 80,
    };
    const result = calculateDescontoMarkup(form);
    // salePrice = 80 * 1.5 = 120; profit = 40
    expect(result.calculatedValue).toBeCloseTo(120, 2);
    expect(result.savingsOrProfit).toBeCloseTo(40, 2);
    expect(result.mode).toBe("markup");
  });
});

describe("calculateDescontoMarkup — margem", () => {
  it("computes margin percentage and profit correctly", () => {
    const form: DescontoMarkupFormState = {
      mode: "margem",
      price: 120,
      pct: null,
      cost: 90,
    };
    const result = calculateDescontoMarkup(form);
    // margin = (120-90)/120 * 100 = 25%; profit = 30
    expect(result.calculatedValue).toBeCloseTo(25, 2);
    expect(result.savingsOrProfit).toBeCloseTo(30, 2);
    expect(result.pctResult).toBeCloseTo(25, 2);
    expect(result.mode).toBe("margem");
  });

  it("returns zero margin when cost equals price", () => {
    const form: DescontoMarkupFormState = {
      mode: "margem",
      price: 100,
      pct: null,
      cost: 100,
    };
    const result = calculateDescontoMarkup(form);
    expect(result.calculatedValue).toBe(0);
    expect(result.savingsOrProfit).toBe(0);
  });
});

describe("calculateDescontoMarkup — reverso", () => {
  it("recovers original price from final price and discount pct", () => {
    const form: DescontoMarkupFormState = {
      mode: "reverso",
      price: 75,
      pct: 25,
      cost: null,
    };
    const result = calculateDescontoMarkup(form);
    // originalPrice = 75 / 0.75 = 100; discount = 25
    expect(result.calculatedValue).toBeCloseTo(100, 2);
    expect(result.savingsOrProfit).toBeCloseTo(25, 2);
    expect(result.mode).toBe("reverso");
  });
});

// ─── DESCONTO_MARKUP_MODES constant ──────────────────────────────────────────

describe("DESCONTO_MARKUP_MODES", () => {
  it("contains all four modes", () => {
    expect(DESCONTO_MARKUP_MODES).toContain("desconto");
    expect(DESCONTO_MARKUP_MODES).toContain("markup");
    expect(DESCONTO_MARKUP_MODES).toContain("margem");
    expect(DESCONTO_MARKUP_MODES).toContain("reverso");
  });
});

// ─── createDefaultDescontoMarkupFormState ─────────────────────────────────────

describe("createDefaultDescontoMarkupFormState", () => {
  it("returns defaults with mode=desconto and all fields null", () => {
    const form = createDefaultDescontoMarkupFormState();
    expect(form.mode).toBe("desconto");
    expect(form.price).toBeNull();
    expect(form.pct).toBeNull();
    expect(form.cost).toBeNull();
  });
});
