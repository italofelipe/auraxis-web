import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";

import {
  filterInsightItemsByDimension,
  groupInsightItemsByDimension,
  useInsightsByDimension,
} from "./use-insights-by-dimension";
import type { InsightItem } from "~/features/ai-insights/contracts/ai-insight";

const items: InsightItem[] = [
  {
    type: "saude_financeira",
    dimension: "general",
    title: "Saldo do período",
    message: "Você fechou o período no azul.",
  },
  {
    type: "gasto_elevado",
    dimension: "transactions",
    title: "Despesa fora do padrão",
    message: "Transações de lazer subiram.",
  },
  {
    type: "alerta_meta",
    dimension: "goals",
    title: "Meta em atenção",
    message: "Sua meta está atrasada.",
  },
];

describe("useInsightsByDimension", () => {
  it("includes general items with the requested contextual dimension", () => {
    expect(filterInsightItemsByDimension(items, "transactions")).toEqual([
      items[0],
      items[1],
    ]);
  });

  it("treats legacy items without a dimension as general", () => {
    const legacyItem = {
      type: "padrao_gasto",
      title: "Assinatura recorrente",
      message: "Revise sua assinatura.",
    } as InsightItem;

    expect(filterInsightItemsByDimension([legacyItem], "budgets")).toEqual([
      { ...legacyItem, dimension: "general" },
    ]);
  });

  it("returns computed filtered items for reactive consumers", () => {
    const source = ref(items);
    const dimension = ref<"transactions" | "goals">("transactions");

    const result = useInsightsByDimension(computed(() => source.value), dimension);

    expect(result.items.value.map((item) => item.title)).toEqual([
      "Saldo do período",
      "Despesa fora do padrão",
    ]);

    dimension.value = "goals";

    expect(result.items.value.map((item) => item.title)).toEqual([
      "Saldo do período",
      "Meta em atenção",
    ]);
  });

  it("groups all items in canonical dimension order for the hub", () => {
    const groups = groupInsightItemsByDimension(items);

    expect(groups.map((group) => group.dimension)).toEqual([
      "general",
      "transactions",
      "goals",
    ]);
    expect(groups[0]?.label).toBe("Visão geral");
  });
});
