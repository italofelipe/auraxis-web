import type {
  AIInsightDTO,
  InsightItem,
  InsightType,
  GenerateInsightResponseWithMetaDTO,
} from "~/features/ai-insights/contracts/ai-insight";

export type InsightTone = "danger" | "success" | "info" | "warning" | "neutral";

export interface InsightPresentation {
  readonly label: string;
  readonly tone: InsightTone;
}

export interface AIInsight {
  readonly id: string;
  readonly items: InsightItem[];
  readonly insightType: InsightType;
  readonly periodLabel: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly model: string;
  readonly tokensUsed: number;
  readonly costUsd: number;
  readonly createdAt: string;
}

export interface GenerateAIInsightVariables {
  readonly month?: string;
}

export interface GeneratedAIInsight {
  readonly items: InsightItem[];
  readonly month: string;
  readonly model: string;
  readonly tokensUsed: number;
  readonly costUsd: number;
  readonly cached: boolean;
  readonly callsRemaining: number | null;
}

export const FALLBACK_INSIGHT_ITEM: InsightItem = {
  type: "saude_financeira",
  title: "Insight indisponível",
  message: "Não conseguimos interpretar este insight agora.",
};

const INSIGHT_PRESENTATION: Record<string, InsightPresentation> = {
  gasto_elevado: { label: "Gasto elevado", tone: "danger" },
  oportunidade_economia: { label: "Oportunidade", tone: "success" },
  saude_financeira: { label: "Saúde financeira", tone: "info" },
  alerta_orcamento: { label: "Alerta", tone: "warning" },
  padrao_gasto: { label: "Padrão", tone: "neutral" },
  alerta_meta: { label: "Alerta de meta", tone: "warning" },
  progresso_meta: { label: "Progresso de meta", tone: "info" },
  planejamento_meta: { label: "Planejamento de meta", tone: "info" },
  orcamento_ultrapassado: { label: "Orçamento ultrapassado", tone: "danger" },
  saude_orcamento_mensal: { label: "Saúde do orçamento", tone: "info" },
  conquista_meta: { label: "Conquista de meta", tone: "success" },
  savings_rate_gap: { label: "Taxa de poupança", tone: "danger" },
};

const TYPE_LABELS: Record<InsightType, string> = {
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  recap: "Recap do mês",
};

/**
 * Runtime guard for backend insight item payloads.
 *
 * @param value Candidate value parsed from JSON.
 * @returns True when the value is a valid InsightItem.
 */
const isInsightItem = (value: unknown): value is InsightItem => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.message === "string"
  );
};

/**
 * Removes common Markdown code fences emitted by LLMs around JSON payloads.
 *
 * @param content Raw backend content.
 * @returns Content ready for JSON.parse.
 */
const stripMarkdownJsonFence = (content: string): string => {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const openingLineEnd = trimmed.indexOf("\n");
  const closingFenceStart = trimmed.lastIndexOf("```");
  if (openingLineEnd === -1 || closingFenceStart <= openingLineEnd) {
    return trimmed;
  }

  const language = trimmed.slice(3, openingLineEnd).trim().toLowerCase();
  if (language.length > 0 && language !== "json") {
    return trimmed;
  }

  return trimmed.slice(openingLineEnd + 1, closingFenceStart).trim();
};

/**
 * Returns valid structured items when present.
 *
 * @param items Candidate structured items.
 * @returns Structured insight items or null when invalid/empty.
 */
const normalizeStructuredInsightItems = (
  items: readonly InsightItem[] | undefined,
): InsightItem[] | null => {
  if (Array.isArray(items) && items.length > 0 && items.every(isInsightItem)) {
    return [...items];
  }

  return null;
};

/**
 * Parses the JSON string stored by the backend into renderable insight items.
 *
 * @param content JSON string returned by the backend.
 * @returns Valid insight items or a safe fallback item.
 */
export const parseInsightItems = (content: string): InsightItem[] => {
  try {
    const parsed = JSON.parse(stripMarkdownJsonFence(content)) as unknown;
    if (Array.isArray(parsed) && parsed.every(isInsightItem) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Falls through to a deterministic UI-safe fallback.
  }

  return [FALLBACK_INSIGHT_ITEM];
};

/**
 * Resolves insight items preferring typed backend items over legacy strings.
 *
 * @param items Structured backend items.
 * @param legacyContent Legacy JSON string field.
 * @returns Valid insight items or the deterministic fallback.
 */
const resolveInsightItems = (
  items: readonly InsightItem[] | undefined,
  legacyContent: string,
): InsightItem[] => normalizeStructuredInsightItems(items) ?? parseInsightItems(legacyContent);

/**
 * Maps an API history DTO into the frontend domain model.
 *
 * @param dto Raw backend DTO.
 * @returns AI insight domain object.
 */
export const mapAIInsightDto = (dto: AIInsightDTO): AIInsight => ({
  id: dto.id,
  items: resolveInsightItems(dto.items, dto.content),
  insightType: dto.insight_type,
  periodLabel: dto.period_label,
  periodStart: dto.period_start,
  periodEnd: dto.period_end,
  model: dto.model,
  tokensUsed: dto.tokens_used,
  costUsd: dto.cost_usd,
  createdAt: dto.created_at,
});

/**
 * Maps the generation endpoint payload into UI state.
 *
 * @param dto Generation endpoint payload with rate-limit metadata.
 * @returns Generated insight domain object.
 */
export const mapGeneratedInsight = (
  dto: GenerateInsightResponseWithMetaDTO,
): GeneratedAIInsight => ({
  items: resolveInsightItems(dto.items, dto.insights),
  month: dto.month,
  model: dto.model,
  tokensUsed: dto.tokens_used,
  costUsd: dto.cost_usd,
  cached: dto.cached,
  callsRemaining: dto.callsRemaining,
});

/**
 * Resolves tone and label metadata for a backend insight item type.
 *
 * @param type Backend insight item type.
 * @returns Presentation metadata for UI badges and icon colors.
 */
export const getInsightPresentation = (type: string): InsightPresentation => {
  return INSIGHT_PRESENTATION[type] ?? { label: "Insight", tone: "neutral" };
};

/**
 * Returns the PT-BR label for a persisted insight type.
 *
 * @param type Persisted insight type.
 * @returns Human-readable label.
 */
export const getInsightTypeLabel = (type: InsightType): string => TYPE_LABELS[type];

/**
 * Formats backend period labels for dashboard and history surfaces.
 *
 * @param periodLabel Backend period label.
 * @returns Localized display label.
 */
export const formatInsightPeriod = (periodLabel: string): string => {
  if (/^\d{4}-\d{2}$/.test(periodLabel)) {
    const [year, month] = periodLabel.split("-");
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    return date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(periodLabel)) {
    const [year, month, day] = periodLabel.split("-");
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  }

  return periodLabel;
};

/**
 * Formats an insight creation timestamp for accordion headings.
 *
 * @param createdAt ISO datetime string.
 * @returns Localized date and time.
 */
export const formatInsightCreatedAt = (createdAt: string): string => {
  return new Date(createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Detects whether a generated monthly insight is older than the current month.
 *
 * @param month YYYY-MM insight month.
 * @param now Current date override used by tests.
 * @returns True when the insight month is before the current month.
 */
export const isPreviousMonthInsight = (
  month: string,
  now: Date = new Date(),
): boolean => {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return false;
  }

  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return month < currentMonth;
};
