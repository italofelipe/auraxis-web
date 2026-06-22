import { describe, expect, it } from "vitest";
import { ref } from "vue";

import { useInsightsFluida } from "./use-insights-fluida";
import { FLUIDA_MOCK_SOURCE } from "../model/insight-fluida-mock";
import type { InsightFluidaFieldsDTO } from "~/features/ai-insights/contracts/ai-insight";

const realGeneralDaily: InsightFluidaFieldsDTO = {
  severity: "alerta",
  read_min: 8,
  paragraphs: ["Real A.", "Real B.", "Real C."],
  retro: [
    { key: "yesterday", label: "Ontem (real)", value: -156.3, caption: "Saídas de ontem", sign: "neg" },
    { key: "daybefore", label: "Anteontem (real)", value: 0, caption: "Saídas de anteontem", sign: "neutral" },
    { key: "vs_week", label: "Semana (real)", value: 9800, caption: "Variação", sign: "neg" },
  ],
  series: { daily: [1, 2, 3, 4, 5, 6, 7], weekly: [10, 20, 30, 40, 50, 60] },
  next_step: "Passo real.",
};

const realTransactions: InsightFluidaFieldsDTO = {
  severity: "ok",
  read_min: 3,
  paragraphs: ["Tx real 1.", "Tx real 2."],
  highlights: [{ label: "Maior gasto", value: 11000, sub: "Fatura" }],
  series: { daily: [9, 9, 9, 9, 9, 9, 9], weekly: [8, 8, 8, 8, 8, 8] },
  next_step: "Categorize.",
};

describe("useInsightsFluida — backward-compatible source override", () => {
  it("defaults to the general daily reading using the mock when no insight is given", () => {
    const fluida = useInsightsFluida();
    expect(fluida.cadence.value).toBe("daily");
    expect(fluida.theme.value).toBe("general");
    expect(fluida.view.value.isGeneral).toBe(true);
    expect(fluida.view.value.lead.readMinutes).toBe(15);
    expect(fluida.usingRealData.value).toBe(false);
  });

  it("derives from an explicit full source override", () => {
    const fluida = useInsightsFluida({ source: FLUIDA_MOCK_SOURCE });
    fluida.setTheme("transactions");
    fluida.setCadence("weekly");
    expect(fluida.view.value.lead.kicker).toBe("Transações");
    expect(fluida.view.value.lead.readMinutes).toBe(5);
  });

  it("exposes the tab list in stable order with the general tab first", () => {
    const fluida = useInsightsFluida();
    expect(fluida.tabs.value.map((tab) => tab.id)).toEqual([
      "general",
      "transactions",
      "goals",
      "budgets",
      "credit_cards",
    ]);
  });
});

describe("useInsightsFluida — real insight payload", () => {
  it("maps the real general daily payload onto the view", () => {
    const fluida = useInsightsFluida({ insight: ref(realGeneralDaily) });
    expect(fluida.usingRealData.value).toBe(true);
    expect(fluida.view.value.isGeneral).toBe(true);
    expect(fluida.view.value.paragraphs).toEqual(["Real A.", "Real B.", "Real C."]);
    expect(fluida.view.value.lead.readMinutes).toBe(8);
    expect(fluida.view.value.compare?.[0]?.when).toBe("Ontem (real)");
    expect(fluida.view.value.chart.peakValue).toBe(7);
    expect(fluida.view.value.nextStep).toBe("Passo real.");
  });

  it("falls back to the mock when the insight has no structured fields", () => {
    const fluida = useInsightsFluida({ insight: ref<InsightFluidaFieldsDTO>({}) });
    expect(fluida.usingRealData.value).toBe(false);
    expect(fluida.view.value.paragraphs).toEqual(FLUIDA_MOCK_SOURCE.general.daily.paragraphs);
  });

  it("falls back to the mock when the insight is null", () => {
    const fluida = useInsightsFluida({ insight: ref(null) });
    expect(fluida.usingRealData.value).toBe(false);
    expect(fluida.view.value.lead.title).toBe(FLUIDA_MOCK_SOURCE.general.daily.title);
  });

  it("re-maps reactively when the insight payload arrives later", async () => {
    const insight = ref<InsightFluidaFieldsDTO | null>(null);
    const fluida = useInsightsFluida({ insight });
    expect(fluida.usingRealData.value).toBe(false);

    insight.value = realGeneralDaily;
    expect(fluida.usingRealData.value).toBe(true);
    expect(fluida.view.value.paragraphs).toEqual(["Real A.", "Real B.", "Real C."]);
  });

  it("respects the reading dimension when selecting the theme node", () => {
    const fluida = useInsightsFluida({
      insight: ref(realTransactions),
      dimension: ref("transactions" as const),
    });
    fluida.setTheme("transactions");
    expect(fluida.view.value.isGeneral).toBe(false);
    expect(fluida.view.value.paragraphs).toEqual(["Tx real 1.", "Tx real 2."]);
    expect(fluida.view.value.highlights).toHaveLength(1);
  });

  it("re-maps when the cadence toggle flips, using the real weekly series", () => {
    const fluida = useInsightsFluida({ insight: ref(realGeneralDaily) });
    fluida.setCadence("weekly");
    // weekly general node prose stays from the mock (the real payload addressed
    // the daily cadence), but the shared real series is applied to both.
    expect(fluida.view.value.chart.values).toEqual([10, 20, 30, 40, 50, 60]);
  });
});
