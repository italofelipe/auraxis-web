import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NDataTable } from "naive-ui";

import PortfolioTable from "./PortfolioTable.vue";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Builds a complete WalletEntryDto fixture with optional overrides.
 *
 * @param overrides - Partial overrides applied on top of the default fixture.
 * @returns A complete WalletEntryDto fixture.
 */
const makeEntry = (overrides: Partial<WalletEntryDto> = {}): WalletEntryDto => ({
  id: "e-test",
  name: "Petrobras",
  ticker: "PETR4",
  quantity: 100,
  current_value: 3620,
  cost_basis: 3200,
  register_date: "2024-03-15",
  change_percent: 1.34,
  asset_type: "stock",
  ...overrides,
});

const MOCK_ENTRIES: WalletEntryDto[] = [
  makeEntry({ id: "e-1", name: "Petrobras", ticker: "PETR4" }),
  makeEntry({ id: "e-2", name: "CSHG Logística", ticker: "HGLG11", asset_type: "fii" }),
  makeEntry({
    id: "e-3",
    name: "CDB Banco BTG",
    ticker: null,
    quantity: null,
    cost_basis: null,
    change_percent: null,
    asset_type: "fixed_income",
  }),
];

/**
 * Mounts PortfolioTable with Naive UI components rendered in happy-dom.
 *
 * @param entries - Wallet entries to render.
 * @param loading - Optional loading state.
 * @returns VueWrapper around the mounted component.
 */
function mountTable(
  entries: WalletEntryDto[],
  loading = false,
): ReturnType<typeof mount> {
  return mount(PortfolioTable, { props: { entries, loading } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PortfolioTable", () => {
  it("passes correct row data to NDataTable", () => {
    const wrapper = mountTable(MOCK_ENTRIES);
    const table = wrapper.findComponent(NDataTable);
    expect(table.exists()).toBe(true);
    expect(table.props("data")).toHaveLength(MOCK_ENTRIES.length);
  });

  it("renders custom empty state text when entries list is empty and not loading", () => {
    const wrapper = mountTable([]);
    // The custom NEmpty is rendered; NDataTable is hidden
    expect(wrapper.text()).toContain("Nenhum ativo cadastrado");
    expect(wrapper.findComponent(NDataTable).exists()).toBe(false);
  });

  it("does not render custom empty state when entries are present", () => {
    const wrapper = mountTable(MOCK_ENTRIES);
    // NDataTable is rendered, no custom empty state
    expect(wrapper.findComponent(NDataTable).exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Nenhum ativo cadastrado");
  });

  it("passes loading prop to NDataTable", () => {
    const wrapper = mountTable(MOCK_ENTRIES, true);
    const table = wrapper.findComponent(NDataTable);
    expect(table.props("loading")).toBe(true);
  });

  it("renders NDataTable (not custom empty state) when loading is true even with empty entries", () => {
    const wrapper = mountTable([], true);
    // NDataTable should be present and take over the loading state display
    const table = wrapper.findComponent(NDataTable);
    expect(table.exists()).toBe(true);
    expect(table.props("loading")).toBe(true);
  });

  it("renders entry count in component text", () => {
    const wrapper = mountTable(MOCK_ENTRIES);
    expect(wrapper.text()).toContain(String(MOCK_ENTRIES.length));
  });

  it("renders — for null values in columns", () => {
    const wrapper = mountTable([
      makeEntry({ cost_basis: null, change_percent: null, quantity: null }),
    ]);
    expect(wrapper.text()).toContain("—");
  });
});
