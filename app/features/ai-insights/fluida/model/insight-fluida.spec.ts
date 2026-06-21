import { describe, expect, it } from "vitest";

import {
  buildFluidaSeries,
  deriveFluidaView,
  formatFluidaCurrency,
  formatFluidaSignedCurrency,
  resolveFluidaReadMinutes,
  resolveFluidaSeverity,
  resolveFluidaThemeMeta,
  FLUIDA_THEME_ORDER,
  type FluidaInsightSource,
} from "./insight-fluida";

/**
 * Normalizes the non-breaking space Intl emits between the BRL symbol and the
 * amount so currency assertions stay readable with a regular space.
 *
 * @param value Formatted currency string, possibly containing a NBSP.
 * @returns The same string with NBSP replaced by a regular space.
 */
const normalizeSpaces = (value: string): string => value.replace(/\u00a0/g, " ");

const sampleSource: FluidaInsightSource = {
  meta: {
    model: "GPT-4o",
    generatedAt: "21 de junho de 2026, 06:00",
    referenceLabel: "movimentação até 20 de junho",
    privacyNote: "Seus dados não treinam modelos.",
  },
  series: {
    daily: { values: [1200, 0, 250, 0, 2650, 0, 11950], labels: ["14", "15", "16", "17", "18", "19", "20"] },
    weekly: { values: [4200, 980, 3100, 1400, 9800, 13650], labels: ["S-5", "S-4", "S-3", "S-2", "S-1", "Atual"] },
  },
  general: {
    daily: {
      severity: "atencao",
      readMin: 15,
      title: "Ontem em foco",
      summary: "Resumo diário.",
      paragraphs: ["P1.", "P2.", "P3."],
      nextStep: "Siga em frente.",
      retro: [
        { when: "Ontem · 20 jun", value: -156.3, text: "Apenas 1 lançamento." },
        { when: "Anteontem · 19 jun", value: -11950, text: "Dia pesado." },
        { when: "vs. semana passada", value: 9800, text: "Gastou mais." },
      ],
      alerts: [{ severity: "alta", text: "Fatura em atraso." }],
      pullStat: { label: "Peso da Fatura Maio", value: "55%", caption: "de todas as despesas do mês" },
    },
    weekly: {
      severity: "alerta",
      readMin: 30,
      title: "A semana de 15 a 21",
      summary: "Resumo semanal.",
      paragraphs: ["W1.", "W2.", "W3.", "W4."],
      nextStep: "Construa um colchão.",
      retro: [],
      alerts: [],
      pullStat: { label: "Peso da Fatura Maio", value: "55%", caption: "do mês" },
    },
  },
  themes: {
    transactions: {
      label: "Transações",
      color: "#2E7CF6",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Dia leve",
        summary: "Resumo tema diário.",
        paragraphs: ["T1.", "T2."],
        nextStep: "Categorize.",
        highlights: [
          { label: "Maior gasto", value: "R$ 11.000,00", caption: "Fatura Maio" },
          { label: "Único crédito", value: "R$ 27.675,37", caption: "Salário" },
          { label: "Gasto de ontem", value: "R$ 156,30", caption: "Eletrônicos" },
        ],
      },
      weekly: {
        severity: "atencao",
        readMin: 5,
        title: "Onde o dinheiro foi",
        summary: "Resumo tema semanal.",
        paragraphs: ["TW1.", "TW2.", "TW3."],
        nextStep: "Revise.",
        highlights: [
          { label: "Saídas da semana", value: "R$ 13.650,00", caption: "4 lançamentos" },
        ],
      },
    },
  },
};

describe("resolveFluidaSeverity", () => {
  it("maps 'ok' to a positive tone with green token", () => {
    const result = resolveFluidaSeverity("ok");
    expect(result.tone).toBe("success");
    expect(result.label).toBe("Tudo certo");
    expect(result.colorVar).toBe("var(--color-positive)");
  });

  it("maps 'atencao' to a warning tone with amber token", () => {
    const result = resolveFluidaSeverity("atencao");
    expect(result.tone).toBe("warning");
    expect(result.label).toBe("Atenção");
    expect(result.colorVar).toBe("var(--color-warning)");
  });

  it("maps 'alerta' to a danger tone with red token", () => {
    const result = resolveFluidaSeverity("alerta");
    expect(result.tone).toBe("danger");
    expect(result.label).toBe("Alerta");
    expect(result.colorVar).toBe("var(--color-negative)");
  });

  it("maps alert-level severities 'alta' and 'media'", () => {
    expect(resolveFluidaSeverity("alta").tone).toBe("danger");
    expect(resolveFluidaSeverity("alta").label).toBe("Alta");
    expect(resolveFluidaSeverity("media").tone).toBe("warning");
    expect(resolveFluidaSeverity("media").label).toBe("Média");
  });

  it("falls back to the 'ok' presentation for unknown severities", () => {
    const result = resolveFluidaSeverity("misterio" as never);
    expect(result.tone).toBe("success");
  });
});

describe("resolveFluidaReadMinutes", () => {
  it("uses the node value when present", () => {
    expect(resolveFluidaReadMinutes(7, "daily", false)).toBe(7);
  });

  it("defaults daily theme reading time to 3 minutes", () => {
    expect(resolveFluidaReadMinutes(undefined, "daily", false)).toBe(3);
  });

  it("defaults daily general reading time to 15 minutes", () => {
    expect(resolveFluidaReadMinutes(undefined, "daily", true)).toBe(15);
  });

  it("defaults weekly theme reading time to 5 minutes", () => {
    expect(resolveFluidaReadMinutes(undefined, "weekly", false)).toBe(5);
  });

  it("defaults weekly general reading time to 30 minutes", () => {
    expect(resolveFluidaReadMinutes(undefined, "weekly", true)).toBe(30);
  });
});

describe("buildFluidaSeries", () => {
  it("selects the daily series and flags the peak bar (the 7th day)", () => {
    const result = buildFluidaSeries(sampleSource, "daily");
    expect(result.labels).toEqual(["14", "15", "16", "17", "18", "19", "20"]);
    expect(result.values).toHaveLength(7);
    expect(result.peakIndex).toBe(6);
    expect(result.peakValue).toBe(11950);
  });

  it("selects the weekly series and flags the peak bar (last week)", () => {
    const result = buildFluidaSeries(sampleSource, "weekly");
    expect(result.labels).toEqual(["S-5", "S-4", "S-3", "S-2", "S-1", "Atual"]);
    expect(result.peakIndex).toBe(5);
    expect(result.peakValue).toBe(13650);
  });

  it("keeps the peak index stable at 0 when the series is empty", () => {
    const empty: FluidaInsightSource = {
      ...sampleSource,
      series: { daily: { values: [], labels: [] }, weekly: { values: [], labels: [] } },
    };
    const result = buildFluidaSeries(empty, "daily");
    expect(result.peakIndex).toBe(0);
    expect(result.peakValue).toBe(0);
  });
});

describe("resolveFluidaThemeMeta", () => {
  it("returns the general meta when the theme id is 'general'", () => {
    const meta = resolveFluidaThemeMeta(sampleSource, "general");
    expect(meta.label).toBe("Geral");
    expect(meta.isGeneral).toBe(true);
    expect(meta.colorVar).toBe("var(--fluida-brand)");
  });

  it("returns the theme meta with its accent color for a known theme", () => {
    const meta = resolveFluidaThemeMeta(sampleSource, "transactions");
    expect(meta.label).toBe("Transações");
    expect(meta.isGeneral).toBe(false);
    expect(meta.colorVar).toBe("#2E7CF6");
  });

  it("exposes a stable tab order starting with 'general'", () => {
    expect(FLUIDA_THEME_ORDER[0]).toBe("general");
    expect(FLUIDA_THEME_ORDER).toContain("transactions");
  });
});

describe("formatFluidaCurrency", () => {
  it("formats a value as pt-BR BRL", () => {
    expect(normalizeSpaces(formatFluidaCurrency(11000))).toBe("R$ 11.000,00");
  });

  it("formats the absolute value, dropping the sign", () => {
    expect(normalizeSpaces(formatFluidaCurrency(-156.3))).toBe("R$ 156,30");
  });
});

describe("formatFluidaSignedCurrency", () => {
  it("prefixes a minus glyph for negative amounts", () => {
    expect(normalizeSpaces(formatFluidaSignedCurrency(-156.3))).toBe("− R$ 156,30");
  });

  it("prefixes a plus glyph for positive amounts", () => {
    expect(normalizeSpaces(formatFluidaSignedCurrency(9800))).toBe("+ R$ 9.800,00");
  });
});

describe("deriveFluidaView", () => {
  it("derives the general daily view with lead, compare beat and chart", () => {
    const view = deriveFluidaView(sampleSource, { cadence: "daily", theme: "general" });

    expect(view.cadence).toBe("daily");
    expect(view.themeId).toBe("general");
    expect(view.isGeneral).toBe(true);
    expect(view.lead.kicker).toBe("Geral");
    expect(view.lead.title).toBe("Ontem em foco");
    expect(view.lead.severity.tone).toBe("warning");
    expect(view.lead.readMinutes).toBe(15);

    // general view exposes the comparison cards from retro
    expect(view.compare).toHaveLength(3);
    expect(normalizeSpaces(view.compare?.[0]?.amountLabel ?? "")).toBe("− R$ 156,30");
    expect(view.compare?.[0]?.isNegative).toBe(true);
    expect(view.compare?.[2]?.isNegative).toBe(false);

    // general view exposes the chart series + alerts
    expect(view.chart.peakIndex).toBe(6);
    expect(view.alerts).toHaveLength(1);
    expect(view.highlights).toBeUndefined();

    // paragraphs flow through unchanged
    expect(view.paragraphs).toEqual(["P1.", "P2.", "P3."]);
    expect(view.nextStep).toBe("Siga em frente.");
    expect(view.pullStat?.value).toBe("55%");
  });

  it("derives a theme view with highlight tiles instead of compare cards", () => {
    const view = deriveFluidaView(sampleSource, { cadence: "daily", theme: "transactions" });

    expect(view.isGeneral).toBe(false);
    expect(view.lead.kicker).toBe("Transações");
    expect(view.lead.accentColor).toBe("#2E7CF6");
    expect(view.compare).toBeUndefined();
    expect(view.alerts).toBeUndefined();
    expect(view.highlights).toHaveLength(3);
    expect(view.highlights?.[0]?.value).toBe("R$ 11.000,00");
    // the chart is still derived so the beat list can render it generically
    expect(view.chart.values).toHaveLength(7);
  });

  it("switches series and reading time when cadence flips to weekly", () => {
    const view = deriveFluidaView(sampleSource, { cadence: "weekly", theme: "general" });
    expect(view.lead.readMinutes).toBe(30);
    expect(view.chart.peakIndex).toBe(5);
    expect(view.chart.values).toHaveLength(6);
  });

  it("falls back to the general node when an unknown theme is requested", () => {
    const view = deriveFluidaView(sampleSource, { cadence: "daily", theme: "unknown" as never });
    expect(view.isGeneral).toBe(true);
    expect(view.themeId).toBe("general");
  });
});
