import { describe, expect, it } from "vitest";

import {
  formatInsightPeriod,
  getInsightPresentation,
  isPreviousMonthInsight,
  mapAIInsightDto,
  mapGeneratedInsight,
  parseInsightItems,
  resolveInsightAnchorDate,
  selectFluidaFields,
} from "./ai-insight";
import type {
  AIInsightDTO,
  GenerateInsightResponseWithMetaDTO,
  InsightItem,
} from "~/features/ai-insights/contracts/ai-insight";

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
      dimension: "transactions",
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
        dimension: "transactions",
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
        dimension: "general",
        title: "Orçamento em atenção",
        message: "A categoria Mercado passou do limite planejado.",
      },
    ]);
  });

  it("returns a graceful neutral fallback when backend content is malformed", () => {
    const items = parseInsightItems("not-json");

    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Sem novidades por aqui");
    // Never surface a technical error to the user.
    expect(items[0]?.title).not.toContain("indisponível");
    expect(items[0]?.message).not.toContain("interpretar");
  });

  it("parses the spending_patterns shape into transactions-dimension items", () => {
    const content = JSON.stringify({
      patterns: [
        {
          description: "Picos de consumo logo após o recebimento",
          frequency: "alta",
          average_value: 5000,
          suggested_action: "Reavalie gastos logo após receber.",
          severity: "high",
        },
      ],
    });

    const items = parseInsightItems(content);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "padrao_gasto",
      dimension: "transactions",
      title: "Picos de consumo logo após o recebimento",
    });
    expect(items[0]?.message).toContain("Reavalie gastos logo após receber.");
    expect(items[0]?.message).toContain("alta");
  });

  it("never returns the error fallback for the spending_patterns shape", () => {
    const items = parseInsightItems(JSON.stringify({ patterns: [{ description: "X" }] }));

    expect(items.some((i) => i.title.includes("indisponível"))).toBe(false);
    expect(items[0]?.dimension).toBe("transactions");
  });

  it("maps snake_case DTO fields into the dashboard domain model", () => {
    const mapped = mapAIInsightDto(makeDto());

    expect(mapped).toMatchObject({
      id: "insight-1",
      insightType: "monthly",
      periodType: "monthly",
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
        dimension: "goals",
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
        dimension: "general",
        title: "Taxa de poupança abaixo do plano",
        message: "Você precisa poupar mais 8% da renda para atingir o objetivo.",
      },
    ];

    const mapped = mapGeneratedInsight({
      id: "11111111-1111-1111-1111-111111111111",
      summary: "Resumo mensal",
      items,
      period_type: "monthly",
      period_label: "2026-05",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      model: "gpt-4o-mini",
      tokens_used: 180,
      cost_usd: 0.00003,
      cached: false,
      forecast: true,
      callsRemaining: 1,
      callsRemainingMonth: 12,
    });

    expect(mapped.items).toEqual(items);
    expect(mapped.summary).toBe("Resumo mensal");
    expect(mapped.periodType).toBe("monthly");
    expect(mapped.periodLabel).toBe("2026-05");
    expect(mapped.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(mapped.forecast).toBe(true);
    expect(mapped.callsRemainingMonth).toBe(12);
  });

  it("defaults id to null and forecast to false when the backend omits them", () => {
    const mapped = mapGeneratedInsight({
      summary: "Resumo do dia",
      items: [
        {
          type: "saude_financeira",
          dimension: "general",
          title: "Tudo certo",
          message: "Suas contas estão equilibradas.",
        },
      ],
      period_type: "daily",
      period_label: "2026-05-18",
      period_start: "2026-05-18",
      period_end: "2026-05-18",
      model: "gpt-4o-mini",
      tokens_used: 60,
      cost_usd: 0.00001,
      cached: false,
      callsRemaining: null,
      callsRemainingMonth: null,
    });

    expect(mapped.id).toBeNull();
    expect(mapped.forecast).toBe(false);
    expect(mapped.callsRemainingMonth).toBeNull();
  });

  it("falls back legacy items without dimension to general", () => {
    const mapped = mapAIInsightDto(
      makeDto({
        content: JSON.stringify({
          summary: "Resumo legado",
          items: [
            {
              type: "padrao_gasto",
              title: "Assinaturas recorrentes",
              message: "Há cobranças recorrentes para revisar.",
            },
          ],
        }),
        items: undefined,
      }),
    );

    expect(mapped.items).toEqual([
      {
        type: "padrao_gasto",
        dimension: "general",
        title: "Assinaturas recorrentes",
        message: "Há cobranças recorrentes para revisar.",
      },
    ]);
    expect(mapped.summary).toBe("Resumo legado");
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

describe("resolveInsightAnchorDate", () => {
  const now = new Date(2026, 4, 15); // 2026-05-15

  it("returns undefined when no period start is selected", () => {
    expect(resolveInsightAnchorDate(null, now)).toBeUndefined();
  });

  it("returns undefined for the current month so the backend uses today", () => {
    const currentMonthStart = new Date(2026, 4, 1).getTime();
    expect(resolveInsightAnchorDate(currentMonthStart, now)).toBeUndefined();
  });

  it("anchors to the first day of a future month for forecast mode", () => {
    const futureMonthStart = new Date(2026, 5, 1).getTime();
    expect(resolveInsightAnchorDate(futureMonthStart, now)).toBe("2026-06-01");
  });

  it("anchors to the first day of a past month for history", () => {
    const pastMonthStart = new Date(2026, 2, 1).getTime();
    expect(resolveInsightAnchorDate(pastMonthStart, now)).toBe("2026-03-01");
  });
});

describe("Fluida fields passthrough", () => {
  /**
   * Builds a generation-response fixture carrying the additive Fluida fields.
   *
   * @param overrides Partial overrides on the base payload.
   * @returns Generation response DTO with rate-limit metadata.
   */
  const makeGenerated = (
    overrides: Partial<GenerateInsightResponseWithMetaDTO> = {},
  ): GenerateInsightResponseWithMetaDTO => ({
    summary: "Resumo",
    items: [
      { type: "saude_financeira", dimension: "general", title: "Ok", message: "Equilibrado." },
    ],
    period_type: "daily",
    period_label: "2026-06-20",
    period_start: "2026-06-20",
    period_end: "2026-06-20",
    model: "gpt-4o",
    tokens_used: 100,
    cost_usd: 0.0001,
    cached: false,
    callsRemaining: 1,
    callsRemainingMonth: 10,
    ...overrides,
  });

  it("carries the structured Fluida fields through mapGeneratedInsight", () => {
    const mapped = mapGeneratedInsight(
      makeGenerated({
        paragraphs: ["P1.", "P2."],
        retro: [{ key: "yesterday", label: "Ontem", value: 156.3, caption: "Saídas", sign: "neg" }],
        series: { daily: [1, 2, 3, 4, 5, 6, 7], weekly: [1, 2, 3, 4, 5, 6] },
        highlights: [{ label: "Maior gasto", value: 11000, sub: "Fatura" }],
        severity: "alerta",
        read_min: 9,
        next_step: "Quite a fatura.",
      }),
    );

    expect(mapped.fluida).toBeDefined();
    expect(mapped.fluida?.paragraphs).toEqual(["P1.", "P2."]);
    expect(mapped.fluida?.retro?.[0]?.label).toBe("Ontem");
    expect(mapped.fluida?.series?.daily).toHaveLength(7);
    expect(mapped.fluida?.highlights?.[0]?.value).toBe(11000);
    expect(mapped.fluida?.severity).toBe("alerta");
    expect(mapped.fluida?.read_min).toBe(9);
    expect(mapped.fluida?.next_step).toBe("Quite a fatura.");
  });

  it("yields a null fluida payload when the backend omits the structured fields", () => {
    const mapped = mapGeneratedInsight(makeGenerated());
    expect(mapped.fluida).toBeNull();
  });

  it("selectFluidaFields extracts only the additive Fluida keys", () => {
    const fields = selectFluidaFields(
      makeGenerated({
        paragraphs: ["only paragraphs"],
        next_step: "do this",
      }),
    );
    expect(fields).toEqual({
      severity: undefined,
      read_min: undefined,
      paragraphs: ["only paragraphs"],
      retro: undefined,
      highlights: undefined,
      alerts: undefined,
      series: undefined,
      next_step: "do this",
    });
  });

  it("selectFluidaFields returns null when no Fluida field is present", () => {
    expect(selectFluidaFields(makeGenerated())).toBeNull();
  });
});
