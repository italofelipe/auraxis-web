import { describe, expect, it } from "vitest";

import {
  formatInsightPeriod,
  getInsightPresentation,
  isPreviousMonthInsight,
  mapAIInsightDto,
  mapGeneratedInsight,
  parseInsightItems,
} from "./ai-insight";
import type { AIInsightDTO, InsightItem } from "~/features/ai-insights/contracts/ai-insight";

/**
 * Builds a valid AIInsightDTO fixture for model tests.
 *
 * @param overrides Partial DTO overrides.
 * @returns Complete AI insight DTO.
 */
const makeDto = (overrides: Partial<AIInsightDTO> = {}): AIInsightDTO => ({
  id: "insight-1",
  content: JSON.stringify([
    {
      type: "gasto_elevado",
      title: "Delivery em alta",
      message: "Pedidos por aplicativo subiram 32% no período.",
    },
  ]),
  insight_type: "monthly",
  period_label: "2026-05",
  period_start: "2026-05-01",
  period_end: "2026-05-31",
  model: "gpt-4o-mini",
  tokens_used: 320,
  cost_usd: 0.000048,
  created_at: "2026-05-12T08:15:00Z",
  ...overrides,
});

describe("AI insight model", () => {
  it("parses backend JSON content into insight items", () => {
    const items = parseInsightItems(makeDto().content);

    expect(items).toEqual([
      {
        type: "gasto_elevado",
        title: "Delivery em alta",
        message: "Pedidos por aplicativo subiram 32% no período.",
      },
    ]);
  });

  it("parses backend JSON content wrapped in a Markdown code fence", () => {
    const items = parseInsightItems(`\`\`\`json
[
  {
    "type": "orcamento_ultrapassado",
    "title": "Orçamento em atenção",
    "message": "A categoria Mercado passou do limite planejado."
  }
]
\`\`\``);

    expect(items).toEqual([
      {
        type: "orcamento_ultrapassado",
        title: "Orçamento em atenção",
        message: "A categoria Mercado passou do limite planejado.",
      },
    ]);
  });

  it("returns a safe fallback when backend content is malformed", () => {
    const items = parseInsightItems("not-json");

    expect(items).toEqual([
      {
        type: "saude_financeira",
        title: "Insight indisponível",
        message: "Não conseguimos interpretar este insight agora.",
      },
    ]);
  });

  it("maps snake_case DTO fields into the dashboard domain model", () => {
    const mapped = mapAIInsightDto(makeDto());

    expect(mapped).toMatchObject({
      id: "insight-1",
      insightType: "monthly",
      periodLabel: "2026-05",
      model: "gpt-4o-mini",
      tokensUsed: 320,
      costUsd: 0.000048,
    });
    expect(mapped.items[0]?.title).toBe("Delivery em alta");
  });

  it("prefers structured history items when the backend includes them", () => {
    const items: InsightItem[] = [
      {
        type: "alerta_meta",
        title: "Meta em risco",
        message: "Seu ritmo atual está abaixo do necessário para bater a meta.",
      },
    ];
    const dto = { ...makeDto({ content: "not-json" }), items };

    const mapped = mapAIInsightDto(dto);

    expect(mapped.items).toEqual(items);
  });

  it("prefers structured generated items instead of parsing the legacy insights string", () => {
    const items: InsightItem[] = [
      {
        type: "savings_rate_gap",
        title: "Taxa de poupança abaixo do plano",
        message: "Você precisa poupar mais 8% da renda para atingir o objetivo.",
      },
    ];

    const mapped = mapGeneratedInsight({
      insights: "not-json",
      items,
      month: "2026-05",
      model: "gpt-4o-mini",
      tokens_used: 180,
      cost_usd: 0.00003,
      cached: false,
      callsRemaining: 1,
    });

    expect(mapped.items).toEqual(items);
  });

  it("formats monthly and daily period labels for PT-BR UI", () => {
    expect(formatInsightPeriod("2026-05")).toBe("maio de 2026");
    expect(formatInsightPeriod("2026-05-12")).toBe("12/05/2026");
  });

  it("detects insights generated from the previous month", () => {
    const now = new Date("2026-05-12T11:00:00Z");

    expect(isPreviousMonthInsight("2026-04", now)).toBe(true);
    expect(isPreviousMonthInsight("2026-05", now)).toBe(false);
  });

  it("returns visual presentation metadata for known insight types", () => {
    expect(getInsightPresentation("oportunidade_economia")).toMatchObject({
      tone: "success",
      label: "Oportunidade",
    });
    expect(getInsightPresentation("alerta_meta")).toMatchObject({
      tone: "warning",
      label: "Alerta de meta",
    });
    expect(getInsightPresentation("savings_rate_gap")).toMatchObject({
      tone: "danger",
      label: "Taxa de poupança",
    });
    expect(getInsightPresentation("unknown")).toMatchObject({
      tone: "neutral",
      label: "Insight",
    });
  });
});
