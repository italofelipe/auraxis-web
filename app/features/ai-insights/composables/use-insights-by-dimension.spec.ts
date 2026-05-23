import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";

import {
  filterInsightItemsByDimension,
  getInsightSurfaceConfig,
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
  it("returns only items from the requested contextual dimension", () => {
    expect(filterInsightItemsByDimension(items, "transactions")).toEqual([items[1]]);
  });

  it("does not leak legacy general items into contextual surfaces", () => {
    const legacyItem = {
      type: "padrao_gasto",
      title: "Assinatura recorrente",
      message: "Revise sua assinatura.",
    } as InsightItem;

    expect(filterInsightItemsByDimension([legacyItem], "budgets")).toEqual([]);
  });

  it("returns computed filtered items for reactive consumers", () => {
    const source = ref(items);
    const dimension = ref<"transactions" | "goals">("transactions");

    const result = useInsightsByDimension(computed(() => source.value), dimension);

    expect(result.items.value.map((item) => item.title)).toEqual([
      "Despesa fora do padrão",
    ]);

    dimension.value = "goals";

    expect(result.items.value.map((item) => item.title)).toEqual([
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

  it("supports wallet insights in contextual filtering and hub grouping", () => {
    const walletItem = {
      type: "saude_financeira",
      dimension: "wallet",
      title: "Carteira diversificada",
      message: "Sua carteira tem classes diferentes.",
    } as InsightItem;

    expect(filterInsightItemsByDimension([walletItem], "wallet" as never)).toEqual([walletItem]);
    expect(groupInsightItemsByDimension([walletItem]).map((group) => group.dimension)).toEqual(["wallet"]);
  });

  it("maps app routes to source surfaces and contextual dimensions", () => {
    expect(getInsightSurfaceConfig("/transactions")).toEqual({
      sourceSurface: "transactions",
      dimension: "transactions",
    });
    expect(getInsightSurfaceConfig("/portfolio")).toEqual({
      sourceSurface: "wallet",
      dimension: "wallet",
    });
    expect(getInsightSurfaceConfig("/insights")).toEqual({
      sourceSurface: "insights",
      dimension: undefined,
    });
  });
});
