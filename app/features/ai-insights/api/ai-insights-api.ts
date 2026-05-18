import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AIInsightHistoryDTO,
  GenerateInsightRequestDTO,
  GenerateInsightResponseDTO,
  GenerateInsightResponseWithMetaDTO,
  InsightPeriodType,
  V2EnvelopeDTO,
} from "~/features/ai-insights/contracts/ai-insight";

/**
 * Parses the AI rate-limit header into a numeric remaining-call count.
 *
 * @param value Raw Axios header value.
 * @returns Remaining calls, or null when absent/invalid.
 */
const parseCallsRemaining = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const AI_CONSENT_VERSION = "1.0";

interface ConsentRecordDTO {
  readonly kind: string;
  readonly action: string;
}

interface ConsentListDTO {
  readonly items: readonly ConsentRecordDTO[];
}

/**
 * Extracts the typed payload from a v2 envelope while accepting legacy flat
 * payloads used in older mocks.
 *
 * @param payload Backend response body.
 * @returns Unwrapped payload.
 */
const unwrap = <T>(payload: V2EnvelopeDTO<T> | T): T => {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as V2EnvelopeDTO<T>).data !== undefined
  ) {
    return (payload as V2EnvelopeDTO<T>).data as T;
  }

  return payload as T;
};

/**
 * HTTP adapter for AI insight endpoints.
 */
export class AIInsightsApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured with auth and API contract headers.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Generates or retrieves the cached insight for the requested backend period.
   *
   * @param variables Period generation variables.
   * @param variables.periodType Daily, weekly or monthly insight granularity.
   * @param variables.anchorDate Optional YYYY-MM-DD anchor date for the period.
   * @returns Generated insight payload plus remaining daily call count.
   */
  async generateInsight(variables: {
    readonly periodType: InsightPeriodType;
    readonly anchorDate?: string;
  }): Promise<GenerateInsightResponseWithMetaDTO> {
    const payload: GenerateInsightRequestDTO = {
      period_type: variables.periodType,
      ...(variables.anchorDate ? { anchor_date: variables.anchorDate } : {}),
    };

    const response = await this.#http.post<V2EnvelopeDTO<GenerateInsightResponseDTO>>(
      "/ai/insights/generate",
      payload,
    );
    const data = unwrap<GenerateInsightResponseDTO>(response.data);

    return {
      ...data,
      callsRemaining: parseCallsRemaining(response.headers["x-ai-calls-remaining"]),
    };
  }

  /**
   * Legacy adapter kept for older callers while the UI migrates to period-aware
   * insights. New surfaces should call {@link generateInsight}.
   *
   * @param month Optional YYYY-MM period label.
   * @returns Monthly generated insight payload.
   */
  async generateSpendingInsight(month?: string): Promise<GenerateInsightResponseWithMetaDTO> {
    return this.generateInsight({
      periodType: "monthly",
      ...(month ? { anchorDate: `${month}-01` } : {}),
    });
  }

  /**
   * Records explicit user consent for AI-powered financial insights.
   */
  async grantAIConsent(): Promise<void> {
    await this.#http.post("/me/consents", {
      kind: "ai",
      version: AI_CONSENT_VERSION,
      action: "granted",
      source: "web",
    });
  }

  /**
   * Checks the latest consent state without triggering AI generation.
   *
   * @returns True when AI consent is currently granted.
   */
  async hasAIConsent(): Promise<boolean> {
    const response = await this.#http.get<V2EnvelopeDTO<ConsentListDTO>>("/me/consents");
    const data = unwrap<ConsentListDTO>(response.data);

    return data.items.some((item) => item.kind === "ai" && item.action === "granted");
  }

  /**
   * Fetches paginated generated insights for the authenticated user.
   *
   * @param page One-based page number.
   * @param perPage Number of items per page.
   * @returns Paginated history DTO.
   */
  async fetchInsightHistory(page = 1, perPage = 20): Promise<AIInsightHistoryDTO> {
    const response = await this.#http.get<V2EnvelopeDTO<AIInsightHistoryDTO>>(
      "/ai/insights/history",
      { params: { page, per_page: perPage } },
    );

    return unwrap<AIInsightHistoryDTO>(response.data);
  }
}

/**
 * Resolves the AI insights API client using the shared HTTP adapter.
 *
 * @returns AI insights API client.
 */
export const useAIInsightsApiClient = (): AIInsightsApiClient => {
  return new AIInsightsApiClient(useHttp());
};
