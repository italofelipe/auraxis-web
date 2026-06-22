import { describe, expect, it } from "vitest";

import { insightToFluidaVM, hasFluidaPayload } from "./insight-to-fluida-vm";
import { FLUIDA_MOCK_SOURCE } from "./insight-fluida-mock";
import { deriveFluidaView } from "./insight-fluida";
import type { InsightFluidaFieldsDTO } from "~/features/ai-insights/contracts/ai-insight";

/**
 * Normalizes the non-breaking space Intl emits between the BRL symbol and the
 * amount so currency assertions stay readable with a regular space.
 *
 * @param value Formatted currency string, possibly containing a NBSP.
 * @returns The same string with NBSP replaced by a regular space.
 */
const normalizeSpaces = (value: string): string => value.replace(/\u00a0/g, " ");

/**
 * A complete, realistic `general` daily payload mirroring the backend builder
 * (`insight_fluida_builder.py`). The builder emits ONLY the editorial body and
 * numbers — `paragraphs` / `retro` / `series` / `highlights`. It does NOT emit
 * the per-dimension lead (`severity` / title / opening / reading time / next
 * step); those always come from the mock recorte, mirroring the mobile mapper.
 */
const generalDailyDto: InsightFluidaFieldsDTO = {
  paragraphs: ["Parágrafo real 1.", "Parágrafo real 2.", "Parágrafo real 3."],
  retro: [
    { key: "yesterday", label: "Ontem", value: 156.3, caption: "Saídas de ontem", sign: "neg" },
    { key: "daybefore", label: "Anteontem", value: 0, caption: "Saídas de anteontem", sign: "neutral" },
    { key: "vs_week", label: "Semana vs. anterior", value: -420, caption: "Variação de saídas", sign: "pos" },
  ],
  series: {
    daily: [10, 20, 0, 50, 0, 0, 999],
    weekly: [100, 200, 300, 400, 500, 600],
  },
  highlights: [
    { label: "Maior gasto do mês", value: 11000, sub: "Fatura Maio" },
    { label: "Único crédito", value: 27675.37, sub: "Salário gringo" },
  ],
};

describe("hasFluidaPayload", () => {
  it("returns false when none of the structured fields are present", () => {
    expect(hasFluidaPayload({})).toBe(false);
    expect(hasFluidaPayload(undefined)).toBe(false);
    expect(
      hasFluidaPayload({ paragraphs: [], retro: [], highlights: [], series: { daily: [], weekly: [] } }),
    ).toBe(false);
  });

  it("returns true when at least one structured field carries data", () => {
    expect(hasFluidaPayload({ paragraphs: ["x"] })).toBe(true);
    expect(hasFluidaPayload({ retro: [{ key: "k", label: "l", value: 1, caption: "c", sign: "neg" }] })).toBe(true);
    expect(hasFluidaPayload({ series: { daily: [1], weekly: [] } })).toBe(true);
    expect(hasFluidaPayload({ highlights: [{ label: "l", value: 1, sub: "s" }] })).toBe(true);
  });
});

describe("insightToFluidaVM — fallback", () => {
  it("returns the mock source unchanged when the DTO has no structured fields", () => {
    const vm = insightToFluidaVM({}, { dimension: "general", cadence: "daily" });
    expect(vm).toBe(FLUIDA_MOCK_SOURCE);
  });

  it("returns the mock source unchanged when the DTO is undefined", () => {
    const vm = insightToFluidaVM(undefined, { dimension: "general", cadence: "daily" });
    expect(vm).toBe(FLUIDA_MOCK_SOURCE);
  });
});

describe("insightToFluidaVM — general daily overlay", () => {
  const vm = insightToFluidaVM(generalDailyDto, { dimension: "general", cadence: "daily" });

  it("does not mutate the shared mock source", () => {
    expect(vm).not.toBe(FLUIDA_MOCK_SOURCE);
    expect(FLUIDA_MOCK_SOURCE.general.daily.paragraphs[0]).not.toBe("Parágrafo real 1.");
  });

  it("overlays the real paragraphs onto the general daily node", () => {
    expect(vm.general.daily.paragraphs).toEqual([
      "Parágrafo real 1.",
      "Parágrafo real 2.",
      "Parágrafo real 3.",
    ]);
  });

  it("keeps the editorial lead (severity, reading time, next step, title) from the mock", () => {
    // The backend builder never sends the lead — it must come from the mock
    // recorte, exactly like the mobile mapper.
    expect(vm.general.daily.severity).toBe(FLUIDA_MOCK_SOURCE.general.daily.severity);
    expect(vm.general.daily.readMin).toBe(FLUIDA_MOCK_SOURCE.general.daily.readMin);
    expect(vm.general.daily.nextStep).toBe(FLUIDA_MOCK_SOURCE.general.daily.nextStep);
    expect(vm.general.daily.title).toBe(FLUIDA_MOCK_SOURCE.general.daily.title);
    expect(vm.general.daily.summary).toBe(FLUIDA_MOCK_SOURCE.general.daily.summary);
  });

  it("maps the backend retro shape into Fluida retro entries", () => {
    const retro = vm.general.daily.retro ?? [];
    expect(retro).toHaveLength(3);
    expect(retro[0]?.when).toBe("Ontem");
    expect(retro[0]?.value).toBe(156.3);
    expect(retro[0]?.text).toBe("Saídas de ontem");
  });

  it("overlays both series with generated daily/weekly axis labels", () => {
    expect(vm.series.daily.values).toEqual([10, 20, 0, 50, 0, 0, 999]);
    expect(vm.series.daily.labels).toHaveLength(7);
    expect(vm.series.weekly.values).toEqual([100, 200, 300, 400, 500, 600]);
    expect(vm.series.weekly.labels).toHaveLength(6);
    // last weekly bucket is the current week
    expect(vm.series.weekly.labels[5]).toBe("Atual");
  });

  it("keeps the weekly general node from the mock (single insight only covers one cadence)", () => {
    expect(vm.general.weekly.paragraphs).toEqual(FLUIDA_MOCK_SOURCE.general.weekly.paragraphs);
  });

  it("produces a derivable general daily view with the mock lead and real body", () => {
    const view = deriveFluidaView(vm, { cadence: "daily", theme: "general" });
    expect(view.isGeneral).toBe(true);
    // lead (title + opening + reading time) is mock-derived…
    expect(view.lead.title).toBe(FLUIDA_MOCK_SOURCE.general.daily.title);
    expect(view.lead.summary).toBe(FLUIDA_MOCK_SOURCE.general.daily.summary);
    expect(view.lead.readMinutes).toBe(FLUIDA_MOCK_SOURCE.general.daily.readMin);
    // …while the body (paragraphs + compare + chart) is real
    expect(view.paragraphs).toEqual(["Parágrafo real 1.", "Parágrafo real 2.", "Parágrafo real 3."]);
    expect(view.compare).toHaveLength(3);
    expect(normalizeSpaces(view.compare?.[0]?.amountLabel ?? "")).toBe("+ R$ 156,30");
    expect(view.chart.peakValue).toBe(999);
  });
});

describe("insightToFluidaVM — theme overlay", () => {
  const themeDto: InsightFluidaFieldsDTO = {
    paragraphs: ["Tema real 1.", "Tema real 2."],
    highlights: [
      { label: "Saídas da semana", value: 13650, sub: "4 lançamentos" },
      { label: "Maior gasto", value: 11000, sub: "Fatura" },
    ],
    series: { daily: [1, 2, 3, 4, 5, 6, 7], weekly: [1, 2, 3, 4, 5, 6] },
  };

  it("overlays highlights (formatted BRL) onto the requested theme + cadence node", () => {
    const vm = insightToFluidaVM(themeDto, { dimension: "transactions", cadence: "weekly" });
    const node = vm.themes.transactions?.weekly;
    expect(node?.paragraphs).toEqual(["Tema real 1.", "Tema real 2."]);
    expect(node?.highlights).toHaveLength(2);
    expect(normalizeSpaces(node?.highlights?.[0]?.value ?? "")).toBe("R$ 13.650,00");
    expect(node?.highlights?.[0]?.label).toBe("Saídas da semana");
    expect(node?.highlights?.[0]?.caption).toBe("4 lançamentos");
  });

  it("keeps the per-theme lead (severity, reading time, title) from the mock recorte", () => {
    // The backend sends no lead per theme either — it must come from the mock.
    const vm = insightToFluidaVM(themeDto, { dimension: "transactions", cadence: "weekly" });
    const node = vm.themes.transactions?.weekly;
    const mockNode = FLUIDA_MOCK_SOURCE.themes.transactions?.weekly;
    expect(node?.severity).toBe(mockNode?.severity);
    expect(node?.readMin).toBe(mockNode?.readMin);
    expect(node?.title).toBe(mockNode?.title);
  });

  it("derives a theme view with real highlight tiles", () => {
    const vm = insightToFluidaVM(themeDto, { dimension: "credit_cards", cadence: "daily" });
    const view = deriveFluidaView(vm, { cadence: "daily", theme: "credit_cards" });
    expect(view.isGeneral).toBe(false);
    expect(view.highlights).toHaveLength(2);
    expect(normalizeSpaces(view.highlights?.[0]?.value ?? "")).toBe("R$ 13.650,00");
  });

  it("maps the goals dimension onto the goals theme node", () => {
    const vm = insightToFluidaVM(themeDto, { dimension: "goals", cadence: "daily" });
    expect(vm.themes.goals?.daily.paragraphs).toEqual(["Tema real 1.", "Tema real 2."]);
  });

  it("maps the budgets dimension onto the budgets theme node", () => {
    const vm = insightToFluidaVM(themeDto, { dimension: "budgets", cadence: "weekly" });
    expect(vm.themes.budgets?.weekly.paragraphs).toEqual(["Tema real 1.", "Tema real 2."]);
  });

  it("falls back to the general node for the wallet dimension (no Fluida tab), still overlaying series", () => {
    const vm = insightToFluidaVM(themeDto, { dimension: "wallet", cadence: "daily" });
    // wallet has no Fluida theme tab → general node receives the prose
    expect(vm.general.daily.paragraphs).toEqual(["Tema real 1.", "Tema real 2."]);
    expect(vm.series.daily.values).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("hasFluidaPayload — lead", () => {
  it("returns true when only the editorial lead is present", () => {
    expect(
      hasFluidaPayload({
        lead: {
          severity: "alert",
          read_min: 4,
          title: "Lead real",
          lead: "Abertura real do lead.",
          next_step: "Próximo passo real.",
        },
      }),
    ).toBe(true);
  });
});

describe("insightToFluidaVM — lead overlay", () => {
  const leadDto: InsightFluidaFieldsDTO = {
    paragraphs: ["Corpo real 1.", "Corpo real 2."],
    lead: {
      severity: "alert",
      read_min: 9,
      title: "Título editorial real",
      lead: "Abertura editorial real do lead.",
      next_step: "Próximo passo editorial real.",
    },
  };

  it("overlays the real lead (severity/title/summary/readMin/nextStep) onto the general node", () => {
    const vm = insightToFluidaVM(leadDto, { dimension: "general", cadence: "daily" });
    const node = vm.general.daily;
    // backend severity "alert" maps onto the Fluida "alerta" vocabulary
    expect(node.severity).toBe("alerta");
    expect(node.readMin).toBe(9);
    expect(node.title).toBe("Título editorial real");
    // backend `lead` is the opening summary in the VM
    expect(node.summary).toBe("Abertura editorial real do lead.");
    expect(node.nextStep).toBe("Próximo passo editorial real.");
    // body still overlaid from the same payload
    expect(node.paragraphs).toEqual(["Corpo real 1.", "Corpo real 2."]);
  });

  it("maps every backend severity onto the Fluida vocabulary", () => {
    const cases: ReadonlyArray<["ok" | "attention" | "alert", string]> = [
      ["ok", "ok"],
      ["attention", "atencao"],
      ["alert", "alerta"],
    ];
    for (const [backendSeverity, fluidaSeverity] of cases) {
      const dto: InsightFluidaFieldsDTO = {
        lead: { severity: backendSeverity, read_min: 3, title: "t", lead: "l", next_step: "n" },
      };
      const vm = insightToFluidaVM(dto, { dimension: "general", cadence: "daily" });
      expect(vm.general.daily.severity).toBe(fluidaSeverity);
    }
  });

  it("overlays the real lead onto the requested theme + cadence node", () => {
    const vm = insightToFluidaVM(leadDto, { dimension: "transactions", cadence: "weekly" });
    const node = vm.themes.transactions?.weekly;
    expect(node?.severity).toBe("alerta");
    expect(node?.title).toBe("Título editorial real");
    expect(node?.summary).toBe("Abertura editorial real do lead.");
    expect(node?.readMin).toBe(9);
    expect(node?.nextStep).toBe("Próximo passo editorial real.");
  });

  it("keeps the mock lead when the payload carries body but no lead (parity with the app body rule)", () => {
    const bodyOnly: InsightFluidaFieldsDTO = {
      paragraphs: ["Só corpo real."],
    };
    const vm = insightToFluidaVM(bodyOnly, { dimension: "general", cadence: "daily" });
    const node = vm.general.daily;
    expect(node.severity).toBe(FLUIDA_MOCK_SOURCE.general.daily.severity);
    expect(node.title).toBe(FLUIDA_MOCK_SOURCE.general.daily.title);
    expect(node.summary).toBe(FLUIDA_MOCK_SOURCE.general.daily.summary);
    expect(node.readMin).toBe(FLUIDA_MOCK_SOURCE.general.daily.readMin);
    expect(node.nextStep).toBe(FLUIDA_MOCK_SOURCE.general.daily.nextStep);
    // body still real
    expect(node.paragraphs).toEqual(["Só corpo real."]);
  });

  it("uses the mock skeleton when only a lead is present (no body), still overlaying the real lead", () => {
    const vm = insightToFluidaVM(
      { lead: { severity: "ok", read_min: 2, title: "Apenas lead", lead: "Abertura.", next_step: "Passo." } },
      { dimension: "general", cadence: "daily" },
    );
    const node = vm.general.daily;
    expect(node.severity).toBe("ok");
    expect(node.title).toBe("Apenas lead");
    expect(node.summary).toBe("Abertura.");
    // body falls back to the mock (no paragraphs in the payload)
    expect(node.paragraphs).toEqual(FLUIDA_MOCK_SOURCE.general.daily.paragraphs);
  });

  it("derives a view whose lead is the real one when the payload carries it", () => {
    const vm = insightToFluidaVM(leadDto, { dimension: "general", cadence: "daily" });
    const view = deriveFluidaView(vm, { cadence: "daily", theme: "general" });
    expect(view.lead.title).toBe("Título editorial real");
    expect(view.lead.summary).toBe("Abertura editorial real do lead.");
    expect(view.lead.readMinutes).toBe(9);
    expect(view.lead.severity.tone).toBe("danger");
    expect(view.nextStep).toBe("Próximo passo editorial real.");
  });
});

describe("insightToFluidaVM — partial payloads", () => {
  it("overlays only the series when that is the sole field provided", () => {
    const vm = insightToFluidaVM(
      { series: { daily: [5, 5, 5, 5, 5, 5, 5], weekly: [9, 9, 9, 9, 9, 9] } },
      { dimension: "general", cadence: "daily" },
    );
    expect(vm.series.daily.values).toEqual([5, 5, 5, 5, 5, 5, 5]);
    // prose untouched → still the mock's general daily paragraphs
    expect(vm.general.daily.paragraphs).toEqual(FLUIDA_MOCK_SOURCE.general.daily.paragraphs);
  });

  it("keeps mock paragraphs when the DTO sends an empty paragraphs array", () => {
    const vm = insightToFluidaVM(
      { paragraphs: [], retro: [{ key: "k", label: "Ontem", value: 1, caption: "c", sign: "neg" }] },
      { dimension: "general", cadence: "daily" },
    );
    expect(vm.general.daily.paragraphs).toEqual(FLUIDA_MOCK_SOURCE.general.daily.paragraphs);
    expect(vm.general.daily.retro?.[0]?.when).toBe("Ontem");
  });
});
