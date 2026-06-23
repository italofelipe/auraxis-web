import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import type { StatementViewModel } from "../model/credit-card-statement";
import type { EnrichedTransaction } from "../utils/transaction-billing";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import FaturasView from "./FaturasView.vue";

vi.mock("~/components/ui/UiIcon/UiIcon.vue", () => ({
  default: { props: ["name", "size"], template: "<span data-testid='ui-icon' />" },
}));

vi.mock("~/components/ui/UiSurfaceCard/UiSurfaceCard.vue", () => ({
  default: {
    props: ["as"],
    template: "<component :is='as || \"div\"'><slot /></component>",
  },
}));

vi.mock("./charts/CreditCardBillsAreaTrend.vue", () => ({
  default: { template: "<div data-testid='trend-chart' />" },
}));

vi.mock("./charts/CreditCardCategoryHBars.vue", () => ({
  default: { template: "<div data-testid='category-chart' />" },
}));

vi.mock("./CreditCardMonthSwitcher.vue", () => ({
  default: {
    props: ["monthLabel"],
    emits: ["shift"],
    template: "<button data-testid='month-switcher' @click='$emit(\"shift\", 1)'>{{ monthLabel }}</button>",
  },
}));

vi.mock("./CreditCardRailItem.vue", () => ({
  default: {
    props: ["label"],
    emits: ["select"],
    template: "<button data-testid='rail-item' @click='$emit(\"select\")'>{{ label }}</button>",
  },
}));

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["type", "tertiary", "size"],
    emits: ["click"],
    template: "<button @click='$emit(\"click\", $event)'><slot name='icon' /><slot /></button>",
  },
}));

/**
 * Builds a credit card fixture for the statement view.
 *
 * @param overrides Fields to override.
 * @returns Credit card fixture.
 */
const cardFixture = (overrides: Partial<CreditCardDto> = {}): CreditCardDto => ({
  id: "cc-1",
  name: "Cartão Inter",
  brand: "mastercard",
  limit_amount: 5000,
  closing_day: 5,
  due_day: 10,
  bank: "Inter",
  description: null,
  benefits: null,
  created_at: null,
  updated_at: null,
  ...overrides,
});

/**
 * Builds an enriched transaction fixture for the invoice row.
 *
 * @param overrides Fields to override.
 * @returns Enriched transaction fixture.
 */
const txFixture = (overrides: Partial<EnrichedTransaction> = {}): EnrichedTransaction => ({
  transaction: { id: overrides.id ?? "tx-1" } as TransactionDto,
  id: "tx-1",
  title: "Notebook Dell Inspiron",
  amount: 899.9,
  purchaseDate: "2026-06-13",
  tagId: "tag-eletronicos",
  creditCardId: "cc-1",
  billMonth: "2026-06",
  isInstallment: true,
  installmentCount: 10,
  installmentGroupId: "installment-1",
  isRecurring: false,
  status: "pending",
  ...overrides,
});

/**
 * Builds the minimal statement view-model consumed by FaturasView.
 *
 * @param item Invoice item to expose.
 * @returns Statement view-model fixture.
 */
const statementFixture = (item: EnrichedTransaction): StatementViewModel => ({
  month: "2026-06",
  monthLabel: "junho de 2026",
  cardId: "cc-1",
  total: item.amount,
  itemCount: 1,
  status: { label: "Aberta", tone: "open" },
  closingDate: "2026-06-05",
  dueDate: "2026-06-10",
  categories: [{
    tagId: "tag-eletronicos",
    name: "Eletrônicos",
    color: "#594FC2",
    total: item.amount,
    count: 1,
    items: [item],
  }],
  items: [item],
  monthlyTrend: [],
  utilizationPct: null,
  limitAmount: 5000,
  railTotals: [{ cardId: "cc-1", name: "Cartão Inter", total: item.amount }],
  allCardsTotal: item.amount,
});

/**
 * Mounts the statement view with one selected card and one invoice item.
 *
 * @returns Mounted component wrapper.
 */
const mountView = (): ReturnType<typeof mount> => mount(FaturasView, {
  props: {
    statement: statementFixture(txFixture()),
    cards: [cardFixture()],
    selectedCardId: "cc-1",
  },
});

describe("FaturasView", () => {
  it("renames card actions to clarify they act on the card", () => {
    const wrapper = mountView();

    expect(wrapper.text()).toContain("Editar cartão");
    expect(wrapper.text()).toContain("Remover cartão");
  });

  it("emits expense actions from the bill item title and icon buttons", async () => {
    const wrapper = mountView();

    await wrapper.get("[data-testid='cc-bill-item-title-tx-1']").trigger("click");
    await wrapper.get("[data-testid='cc-bill-item-edit-tx-1']").trigger("click");
    await wrapper.get("[data-testid='cc-bill-item-duplicate-tx-1']").trigger("click");
    await wrapper.get("[data-testid='cc-bill-item-delete-tx-1']").trigger("click");

    expect(wrapper.emitted("edit-expense")?.map((args) => args[0])).toEqual([
      expect.objectContaining({ id: "tx-1" }),
      expect.objectContaining({ id: "tx-1" }),
    ]);
    expect(wrapper.emitted("duplicate-expense")?.[0]?.[0]).toEqual(
      expect.objectContaining({ id: "tx-1" }),
    );
    expect(wrapper.emitted("delete-expense")?.[0]?.[0]).toEqual(
      expect.objectContaining({ id: "tx-1" }),
    );
  });
});
