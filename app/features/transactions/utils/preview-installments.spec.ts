import { describe, expect, it, vi } from "vitest";

import { addMonths, previewInstallments } from "./preview-installments";

vi.mock("~/utils/currency", () => ({
  formatCurrency: (v: number): string =>
    `R$ ${v.toFixed(2).replace(".", ",")}`,
}));

describe("addMonths", () => {
  it("soma meses simples", () => {
    expect(addMonths(new Date(2026, 4, 17), 11)).toEqual(new Date(2027, 3, 17));
  });

  it("clampa o dia no fim do mês (31/01 + 1 = 28/02)", () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
  });
});

describe("previewInstallments", () => {
  it("calcula valor por parcela e janela de datas", () => {
    const preview = previewInstallments(1200, 12, new Date(2026, 4, 17));
    expect(preview.perInstallment).toBe("R$ 100,00");
    expect(preview.firstDate).toBe("17/05/2026");
    expect(preview.lastDate).toBe("17/04/2027");
    expect(preview.totalCount).toBe(12);
  });

  it("divide valores não exatos", () => {
    const preview = previewInstallments(100, 3, new Date(2026, 0, 10));
    expect(preview.perInstallment).toBe("R$ 33,33");
    expect(preview.totalCount).toBe(3);
  });
});
