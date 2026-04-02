import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TaxBracketTable, {
  type TaxBracketRow,
} from "../TaxBracketTable.vue";

/**
 * Builds a TaxBracketRow with sensible defaults, allowing per-test overrides.
 *
 * @param overrides Partial fields to override in the default row.
 * @returns A complete TaxBracketRow.
 */
const makeRow = (overrides: Partial<TaxBracketRow> = {}): TaxBracketRow => ({
  key: "row-1",
  rangeLabel: "Até R$ 1.518,00",
  rateLabel: "7,5%",
  baseLabel: "R$ 1.518,00",
  taxLabel: "R$ 113,85",
  isActive: true,
  ...overrides,
});

describe("TaxBracketTable", () => {
  it("renders a row for each item in props.rows", () => {
    const rows = [makeRow({ key: "a" }), makeRow({ key: "b" }), makeRow({ key: "c" })];
    const wrapper = mount(TaxBracketTable, { props: { rows } });

    expect(wrapper.findAll(".tax-bracket-table__row")).toHaveLength(3);
  });

  it("shows rangeLabel, rateLabel, baseLabel and taxLabel in the row", () => {
    const row = makeRow({
      rangeLabel: "R$ 1.518,01 — R$ 2.793,88",
      rateLabel: "9%",
      baseLabel: "R$ 500,00",
      taxLabel: "R$ 45,00",
    });
    const wrapper = mount(TaxBracketTable, { props: { rows: [row] } });
    const text = wrapper.text();

    expect(text).toContain("R$ 1.518,01 — R$ 2.793,88");
    expect(text).toContain("9%");
    expect(text).toContain("R$ 500,00");
    expect(text).toContain("R$ 45,00");
  });

  it("applies --active modifier class for active rows", () => {
    const row = makeRow({ isActive: true });
    const wrapper = mount(TaxBracketTable, { props: { rows: [row] } });

    expect(wrapper.find(".tax-bracket-table__row--active").exists()).toBe(true);
    expect(wrapper.find(".tax-bracket-table__row--inactive").exists()).toBe(false);
  });

  it("applies --inactive modifier class for inactive rows", () => {
    const row = makeRow({ isActive: false });
    const wrapper = mount(TaxBracketTable, { props: { rows: [row] } });

    expect(wrapper.find(".tax-bracket-table__row--inactive").exists()).toBe(true);
    expect(wrapper.find(".tax-bracket-table__row--active").exists()).toBe(false);
  });

  it("renders a badge when the row has a badge prop", () => {
    const row = makeRow({ badge: "✓ Sua faixa" });
    const wrapper = mount(TaxBracketTable, { props: { rows: [row] } });

    expect(wrapper.find(".tax-bracket-table__badge").exists()).toBe(true);
    expect(wrapper.find(".tax-bracket-table__badge").text()).toBe("✓ Sua faixa");
  });

  it("does not render a badge when badge prop is absent", () => {
    const row = makeRow({ badge: undefined });
    const wrapper = mount(TaxBracketTable, { props: { rows: [row] } });

    expect(wrapper.find(".tax-bracket-table__badge").exists()).toBe(false);
  });

  it("renders tfoot with totalLabel and totalValue when provided", () => {
    const wrapper = mount(TaxBracketTable, {
      props: {
        rows: [makeRow()],
        totalLabel: "Total INSS",
        totalValue: "R$ 500,00",
      },
    });

    const footer = wrapper.find(".tax-bracket-table__footer-row");
    expect(footer.exists()).toBe(true);
    expect(footer.text()).toContain("Total INSS");
    expect(footer.text()).toContain("R$ 500,00");
  });

  it("does not render tfoot when totalLabel is absent", () => {
    const wrapper = mount(TaxBracketTable, { props: { rows: [makeRow()] } });

    expect(wrapper.find(".tax-bracket-table__footer-row").exists()).toBe(false);
  });

  it("renders custom column headers when provided", () => {
    const wrapper = mount(TaxBracketTable, {
      props: {
        rows: [],
        rangeHeader: "Faixa salarial",
        rateHeader: "Alíquota",
        baseHeader: "Parcela incidente",
        taxHeader: "Desconto",
      },
    });

    const text = wrapper.text();
    expect(text).toContain("Faixa salarial");
    expect(text).toContain("Alíquota");
    expect(text).toContain("Parcela incidente");
    expect(text).toContain("Desconto");
  });
});
