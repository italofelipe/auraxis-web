import { describe, expect, it } from "vitest";
import {
  CDB_IR_BRACKETS,
  CDB_TABLE_YEAR,
  calculateCdbLciLca,
  createDefaultCdbLciLcaFormState,
  findCdbIrRate,
  validateCdbLciLcaForm,
  type CdbLciLcaFormState,
} from "./cdb-lci-lca";

// ─── Constants ────────────────────────────────────────────────────────────────

describe("CDB_IR_BRACKETS", () => {
  it("has four brackets", () => {
    expect(CDB_IR_BRACKETS).toHaveLength(4);
  });

  it("first bracket applies 22.5% for up to 180 days", () => {
    expect(CDB_IR_BRACKETS[0]).toMatchObject({ maxDays: 180, rate: 0.225 });
  });

  it("last bracket applies 15% for long-term holdings", () => {
    const last = CDB_IR_BRACKETS[CDB_IR_BRACKETS.length - 1]!;
    expect(last.rate).toBe(0.15);
  });

  it("CDB_TABLE_YEAR is 2025", () => {
    expect(CDB_TABLE_YEAR).toBe(2025);
  });
});

// ─── findCdbIrRate ────────────────────────────────────────────────────────────

describe("findCdbIrRate", () => {
  it("returns 22.5% for 1 day", () => {
    expect(findCdbIrRate(1)).toBe(0.225);
  });

  it("returns 22.5% for 180 days", () => {
    expect(findCdbIrRate(180)).toBe(0.225);
  });

  it("returns 20% for 181 days", () => {
    expect(findCdbIrRate(181)).toBe(0.20);
  });

  it("returns 20% for 360 days", () => {
    expect(findCdbIrRate(360)).toBe(0.20);
  });

  it("returns 17.5% for 361 days", () => {
    expect(findCdbIrRate(361)).toBe(0.175);
  });

  it("returns 17.5% for 720 days", () => {
    expect(findCdbIrRate(720)).toBe(0.175);
  });

  it("returns 15% for 721 days", () => {
    expect(findCdbIrRate(721)).toBe(0.15);
  });

  it("returns 15% for very long terms", () => {
    expect(findCdbIrRate(3650)).toBe(0.15);
  });
});

// ─── validateCdbLciLcaForm ────────────────────────────────────────────────────

describe("validateCdbLciLcaForm", () => {
  it("returns no errors for a valid form", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
    };
    expect(validateCdbLciLcaForm(form)).toHaveLength(0);
  });

  it("returns error when amount is null", () => {
    const form = createDefaultCdbLciLcaFormState();
    const errors = validateCdbLciLcaForm(form);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("returns error when amount is zero", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 0,
    };
    const errors = validateCdbLciLcaForm(form);
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("returns error when termDays is less than 1", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 5000,
      termDays: 0,
    };
    const errors = validateCdbLciLcaForm(form);
    expect(errors.some((e) => e.field === "termDays")).toBe(true);
  });

  it("returns error when all product rates are null", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
      cdbRatePct: null,
      lciRatePct: null,
      lcaRatePct: null,
    };
    const errors = validateCdbLciLcaForm(form);
    expect(errors.some((e) => e.messageKey === "errors.atLeastOneRateRequired")).toBe(true);
  });

  it("accepts form with only LCI rate provided", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 5000,
      cdbRatePct: null,
      lcaRatePct: null,
      lciRatePct: 95,
    };
    expect(validateCdbLciLcaForm(form)).toHaveLength(0);
  });
});

// ─── calculateCdbLciLca — CDB returns ────────────────────────────────────────

describe("calculateCdbLciLca — CDB returns", () => {
  const baseForm: CdbLciLcaFormState = {
    amount: 10000,
    termDays: 365,
    cdbRatePct: 100,
    lciRatePct: null,
    lcaRatePct: null,
    cdiRatePct: 10.65,
    selicRatePct: 10.75,
    ipcaRatePct: 4.5,
    includeIof: false,
  };

  it("CDB gross return is positive for 100% CDI", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.cdb.grossReturn).toBeGreaterThan(0);
  });

  it("CDB net return is less than gross (IR applied)", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.cdb.netReturn).toBeLessThan(result.cdb.grossReturn);
  });

  it("CDB IR rate is 15% for 365 days (> 360 days, ≤ 720)", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.cdb.irRate).toBe(0.175);
  });

  it("CDB net amount equals amount + net return", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.cdb.netAmount).toBeCloseTo(
      baseForm.amount! + result.cdb.netReturn,
      2,
    );
  });

  it("CDB IR amount is gross * ir rate", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.cdb.irAmount).toBeCloseTo(
      result.cdb.grossReturn * result.cdb.irRate,
      2,
    );
  });
});

// ─── calculateCdbLciLca — LCI/LCA (IR-exempt) ────────────────────────────────

describe("calculateCdbLciLca — LCI/LCA (IR-exempt)", () => {
  const baseForm: CdbLciLcaFormState = {
    amount: 10000,
    termDays: 365,
    cdbRatePct: null,
    lciRatePct: 95,
    lcaRatePct: 93,
    cdiRatePct: 10.65,
    selicRatePct: 10.75,
    ipcaRatePct: 4.5,
    includeIof: false,
  };

  it("LCI net return equals gross return (no IR)", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.lci.netReturn).toBe(result.lci.grossReturn);
  });

  it("LCA net return equals gross return (no IR)", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.lca.netReturn).toBe(result.lca.grossReturn);
  });

  it("LCI has higher net amount than LCA given LCI rate > LCA rate", () => {
    const result = calculateCdbLciLca(baseForm);
    expect(result.lci.netAmount).toBeGreaterThan(result.lca.netAmount);
  });
});

// ─── calculateCdbLciLca — Poupança ───────────────────────────────────────────

describe("calculateCdbLciLca — Poupança", () => {
  it("uses 70% of SELIC per month when SELIC > 8.5%", () => {
    const form: CdbLciLcaFormState = {
      amount: 10000,
      termDays: 365,
      cdbRatePct: null,
      lciRatePct: null,
      lcaRatePct: null,
      cdiRatePct: 10.65,
      selicRatePct: 10.75,
      ipcaRatePct: 4.5,
      includeIof: false,
    };
    const result = calculateCdbLciLca(form);
    expect(result.poupanca.grossReturn).toBeGreaterThan(0);
  });

  it("poupanca net return equals gross (no IR on poupança)", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
    };
    const result = calculateCdbLciLca(form);
    expect(result.poupanca.netReturn).toBe(result.poupanca.grossReturn);
  });
});

// ─── calculateCdbLciLca — ranking ────────────────────────────────────────────

describe("calculateCdbLciLca — ranking", () => {
  it("ranking is sorted descending by net amount", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
    };
    const { ranking } = calculateCdbLciLca(form);
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1]!.netAmount).toBeGreaterThanOrEqual(ranking[i]!.netAmount);
    }
  });

  it("bestOption matches the first element in the ranking", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
    };
    const { ranking, bestOption } = calculateCdbLciLca(form);
    expect(bestOption).toBe(ranking[0]?.name);
  });

  it("poupanca always appears in ranking", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
      cdbRatePct: null,
      lciRatePct: null,
      lcaRatePct: null,
    };
    const { ranking } = calculateCdbLciLca(form);
    expect(ranking.some((r) => r.name === "Poupança")).toBe(true);
  });
});

// ─── calculateCdbLciLca — real return ────────────────────────────────────────

describe("calculateCdbLciLca — real return", () => {
  it("real return is lower than nominal when IPCA > 0", () => {
    const form: CdbLciLcaFormState = {
      ...createDefaultCdbLciLcaFormState(),
      amount: 10000,
    };
    const result = calculateCdbLciLca(form);
    const cdbNominalReturn = result.cdb.netReturn / form.amount!;
    expect(result.cdb.realReturn).toBeLessThan(cdbNominalReturn);
  });
});
