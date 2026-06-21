import { describe, expect, it } from "vitest";

import { useInsightsFluida } from "./use-insights-fluida";
import { FLUIDA_MOCK_SOURCE } from "../model/insight-fluida-mock";

describe("useInsightsFluida", () => {
  it("defaults to the general daily reading", () => {
    const fluida = useInsightsFluida();
    expect(fluida.cadence.value).toBe("daily");
    expect(fluida.theme.value).toBe("general");
    expect(fluida.view.value.isGeneral).toBe(true);
    expect(fluida.view.value.lead.readMinutes).toBe(15);
  });

  it("exposes the tab list in stable order with the general tab first", () => {
    const fluida = useInsightsFluida();
    expect(fluida.tabs.value[0]?.id).toBe("general");
    expect(fluida.tabs.value.map((tab) => tab.id)).toEqual([
      "general",
      "transactions",
      "goals",
      "budgets",
      "credit_cards",
    ]);
    expect(fluida.tabs.value[1]?.label).toBe("Transações");
  });

  it("recomputes the view when the cadence changes", () => {
    const fluida = useInsightsFluida();
    fluida.setCadence("weekly");
    expect(fluida.cadence.value).toBe("weekly");
    expect(fluida.view.value.lead.readMinutes).toBe(30);
    expect(fluida.view.value.chart.values).toHaveLength(6);
  });

  it("recomputes the view when the theme changes", () => {
    const fluida = useInsightsFluida();
    fluida.setTheme("credit_cards");
    expect(fluida.theme.value).toBe("credit_cards");
    expect(fluida.view.value.isGeneral).toBe(false);
    expect(fluida.view.value.lead.kicker).toBe("Cartões");
    expect(fluida.view.value.highlights).toHaveLength(3);
  });

  it("derives from an injected source when provided", () => {
    const fluida = useInsightsFluida(FLUIDA_MOCK_SOURCE);
    fluida.setTheme("transactions");
    fluida.setCadence("weekly");
    expect(fluida.view.value.lead.kicker).toBe("Transações");
    expect(fluida.view.value.lead.readMinutes).toBe(5);
  });
});
