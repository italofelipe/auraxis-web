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
  bank: "Nubank",
  description: null,
  benefits: ["Cashback"],
  created_at: null,
  updated_at: null,
};

/**
 * Monta o card com o cartão fixo de teste.
 *
 * @param props Sobrescritas de props para cenários específicos.
 * @returns Wrapper do componente montado.
 */
const mountCard = (props: Partial<InstanceType<typeof CreditCardCard>["$props"]> = {}): ReturnType<typeof mount> =>
  mount(CreditCardCard, {
    props: { card: CARD, ...props },
    global: { stubs: STUBS },
  });

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

  it("renderiza nome, ciclo e benefits sem dados sensíveis", () => {
    const w = mountCard();
    expect(w.text()).toContain("Nubank");
    expect(w.text()).toContain("Fecha dia 3");
    expect(w.text()).toContain("Vence dia 10");
    expect(w.text()).toContain("Cashback");
    expect(w.text()).not.toContain("1234");
    expect(w.text()).not.toContain("12/2030");
    expect(w.text()).not.toContain("Final não informado");
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

  it("marca o cartão selecionado na lista premium", () => {
    const w = mountCard({ selected: true });
    expect(w.get("[data-testid='credit-card-card']").classes()).toContain("cc-card--selected");
  });

  it("emite select pelo controle dedicado sem acionar ações secundárias", async () => {
    const w = mountCard();
    await w.get("[data-testid='cc-select-card']").trigger("click");

    expect(w.emitted("select")).toHaveLength(1);
    expect(w.emitted("view-bill")).toBeUndefined();
    expect(w.emitted("edit")).toBeUndefined();
    expect(w.emitted("delete")).toBeUndefined();
  });

  it("emite view-bill, edit e delete", async () => {
    const w = mountCard();
    await w.get("[data-testid='cc-view-bill']").trigger("click");
    await w.get("[data-testid='cc-edit']").trigger("click");
    await w.get("[data-testid='cc-delete']").trigger("click");

    expect(w.emitted("view-bill")).toHaveLength(1);
    expect(w.emitted("edit")).toHaveLength(1);
    expect(w.emitted("delete")).toHaveLength(1);
  });
});
