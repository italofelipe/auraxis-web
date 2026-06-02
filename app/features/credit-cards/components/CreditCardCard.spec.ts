import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreditCardDto,
  CreditCardUtilization,
} from "~/features/credit-cards/contracts/credit-card.dto";

import CreditCardCard from "./CreditCardCard.vue";

const utilData = ref<CreditCardUtilization | undefined>(undefined);

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string): string => k }),
}));

vi.mock(
  "~/features/credit-cards/queries/use-credit-card-utilization-query",
  () => ({
    useCreditCardUtilizationQuery: (): Record<string, unknown> => ({
      data: utilData,
    }),
  }),
);

vi.mock("~/utils/currency", () => ({
  formatCurrency: (v: number): string => `R$${v}`,
}));

const STUBS = {
  NTag: { template: "<span><slot /></span>" },
  NButton: { template: "<button><slot /></button>" },
};

const CARD: CreditCardDto = {
  id: "cc-1",
  name: "Nubank",
  brand: "mastercard",
  limit_amount: 5000,
  closing_day: 3,
  due_day: 10,
  last_four_digits: "1234",
  bank: "Nubank",
  description: null,
  benefits: ["Cashback"],
  validity_date: "2030-12-31",
  created_at: null,
  updated_at: null,
};

/**
 * Monta o card com o cartão fixo de teste.
 *
 * @returns Wrapper do componente montado.
 */
const mountCard = (): ReturnType<typeof mount> =>
  mount(CreditCardCard, { props: { card: CARD }, global: { stubs: STUBS } });

describe("CreditCardCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    utilData.value = undefined;
  });

  /**
   * Constrói um snapshot de utilização com o pct informado.
   *
   * @param pct Percentual de utilização.
   * @returns Snapshot de utilização.
   */
  const util = (pct: number): CreditCardUtilization => ({
    cycle: { startDate: "", endDate: "", dueDate: "", status: "open" },
    committedAmount: 3250,
    availableAmount: 1750,
    limitAmount: 5000,
    utilizationPct: pct,
  });

  it("renderiza nome, validade MM/YYYY e benefits", () => {
    const w = mountCard();
    expect(w.text()).toContain("Nubank");
    expect(w.text()).toContain("12/2030");
    expect(w.text()).toContain("Cashback");
  });

  it.each([
    [50, "cc-util--low"],
    [80, "cc-util--mid"],
    [100, "cc-util--high"],
    [120, "cc-util--high"],
  ])("barra usa a faixa de cor correta (pct=%s)", (pct, cls) => {
    utilData.value = util(pct as number);
    const w = mountCard();
    expect(w.get("[data-testid='cc-util-bar']").classes()).toContain(cls);
  });

  it("não renderiza a barra enquanto a utilização não carregou", () => {
    const w = mountCard();
    expect(w.find("[data-testid='cc-util']").exists()).toBe(false);
  });

  it("emite view-bill, edit e delete", async () => {
    const w = mountCard();
    await w.get("[data-testid='cc-view-bill']").trigger("click");
    expect(w.emitted("view-bill")).toHaveLength(1);
  });
});
