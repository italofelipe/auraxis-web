import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AdminAIConsentStatus,
  AdminAIInsightAuditEvent,
  AdminAIInsightDetail,
  AdminAIInsightKpis,
  AdminAIInsightsFilters,
  AdminAIInsightsList,
  AdminAIInsightRiskLevel,
  AdminAIInsightStatus,
  AdminAIInsightSummary,
} from "~/features/admin/insights/model/admin-insight";
import {
  normalizeDateTime,
  unwrapData,
  type V2EnvelopeDto,
} from "~/features/admin/shared/admin-api";

interface AdminAIInsightAuditEventDto {
  readonly id: string;
  readonly action?: string | null;
  readonly created_at?: string | null;
  readonly actor_email?: string | null;
}

interface AdminAIInsightDto {
  readonly id: string;
  readonly user_id?: string | null;
  readonly user_email?: string | null;
  readonly period_label?: string | null;
  readonly status?: string | null;
  readonly model?: string | null;
  readonly tokens_used?: number | null;
  readonly cost_usd?: number | null;
  readonly latency_ms?: number | null;
  readonly consent_status?: string | null;
  readonly evidence_count?: number | null;
  readonly risk_level?: string | null;
  readonly data_quality?: string | null;
  readonly created_at?: string | null;
  readonly summary?: string | null;
  readonly prompt_template_version?: string | null;
  readonly snapshot_hash?: string | null;
  readonly redacted_evidence?: readonly string[] | null;
  readonly audit_events?: readonly AdminAIInsightAuditEventDto[] | null;
}

interface AdminAIInsightKpisDto {
  readonly total_cost_usd?: number | null;
  readonly total_tokens?: number | null;
  readonly failed_count?: number | null;
  readonly missing_consent_count?: number | null;
}

interface AdminAIInsightsListDto {
  readonly items?: readonly AdminAIInsightDto[] | null;
  readonly page?: number | null;
  readonly per_page?: number | null;
  readonly total?: number | null;
  readonly kpis?: AdminAIInsightKpisDto | null;
}

type AdminAIInsightsListResponseDto = AdminAIInsightsListDto | V2EnvelopeDto<AdminAIInsightsListDto>;
type AdminAIInsightDetailResponseDto = AdminAIInsightDto | V2EnvelopeDto<AdminAIInsightDto>;

/**
 * Normalizes API status values for admin insight rows.
 *
 * @param value Raw status from the API.
 * @returns Supported insight status with a conservative default.
 */
const toStatus = (value: string | null | undefined): AdminAIInsightStatus => {
  switch (value) {
    case "generated":
    case "cached":
    case "failed":
    case "rejected":
    case "running":
      return value;
    default:
      return "generated";
  }
};

/**
 * Normalizes AI consent status values.
 *
 * @param value Raw consent status from the API.
 * @returns Supported consent status with a safe missing default.
 */
const toConsentStatus = (value: string | null | undefined): AdminAIConsentStatus => {
  switch (value) {
    case "granted":
    case "revoked":
    case "missing":
      return value;
    default:
      return "missing";
  }
};

/**
 * Normalizes the operational risk level.
 *
 * @param value Raw risk level from the API.
 * @returns Supported risk level with a medium default.
 */
const toRiskLevel = (value: string | null | undefined): AdminAIInsightRiskLevel => {
  switch (value) {
    case "low":
    case "medium":
    case "high":
      return value;
    default:
      return "medium";
  }
};

/**
 * Maps API KPI fields into the admin UI model.
 *
 * @param kpis Optional KPI payload returned by the API.
 * @returns UI-ready insight KPI values.
 */
const mapKpis = (kpis: AdminAIInsightKpisDto | null | undefined): AdminAIInsightKpis => ({
  totalCostUsd: kpis?.total_cost_usd ?? 0,
  totalTokens: kpis?.total_tokens ?? 0,
  failedCount: kpis?.failed_count ?? 0,
  missingConsentCount: kpis?.missing_consent_count ?? 0,
});

/**
 * Maps one AI insight list item into the admin UI model.
 *
 * @param insight Raw insight payload returned by the API.
 * @returns UI-ready insight summary.
 */
const mapSummary = (insight: AdminAIInsightDto): AdminAIInsightSummary => ({
  id: insight.id,
  userId: insight.user_id ?? "unknown",
  userEmail: insight.user_email ?? "usuario@auraxis.local",
  periodLabel: insight.period_label ?? "Período não informado",
  status: toStatus(insight.status),
  model: insight.model ?? "modelo não informado",
  tokensUsed: insight.tokens_used ?? 0,
  costUsd: insight.cost_usd ?? 0,
  latencyMs: insight.latency_ms ?? null,
  consentStatus: toConsentStatus(insight.consent_status),
  evidenceCount: insight.evidence_count ?? insight.redacted_evidence?.length ?? 0,
  riskLevel: toRiskLevel(insight.risk_level),
  dataQuality: insight.data_quality ?? "sem sinalização",
  createdAt: normalizeDateTime(insight.created_at),
});

/**
 * Maps one AI insight audit event into the admin UI model.
 *
 * @param event Raw audit event payload returned by the API.
 * @returns UI-ready audit event.
 */
const mapAuditEvent = (event: AdminAIInsightAuditEventDto): AdminAIInsightAuditEvent => ({
  id: event.id,
  action: event.action ?? "ai.insight.event",
  createdAt: normalizeDateTime(event.created_at),
  actorEmail: event.actor_email ?? null,
});

/**
 * Maps AI insight detail payload into the admin UI model.
 *
 * @param insight Raw insight payload returned by the API.
 * @returns UI-ready insight detail with redacted evidence.
 */
const mapDetail = (insight: AdminAIInsightDto): AdminAIInsightDetail => ({
  ...mapSummary(insight),
  summary: insight.summary ?? "Resumo operacional indisponível.",
  promptTemplateVersion: insight.prompt_template_version ?? "desconhecida",
  snapshotHash: insight.snapshot_hash ?? null,
  redactedEvidence: insight.redacted_evidence ?? [],
  auditEvents: (insight.audit_events ?? []).map(mapAuditEvent),
});

/**
 * Builds list query parameters while omitting inactive filters.
 *
 * @param filters UI filters selected in the admin page.
 * @returns API query parameters for the list endpoint.
 */
const buildListInsightsParams = (
  filters: AdminAIInsightsFilters,
): Record<string, string | number | undefined> => ({
  q: filters.search,
  status: filters.status === "all" ? undefined : filters.status,
  model: filters.model,
  page: filters.page ?? 1,
  per_page: filters.perPage ?? 20,
});

export class AdminInsightsClient {
  readonly #http: AxiosInstance;

  /**
   * Creates an admin AI insights client.
   *
   * @param http Configured Axios instance.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Lists AI insights with operational metadata and KPI totals.
   *
   * @param filters Search, status, model and pagination filters.
   * @returns Paginated list of AI insight summaries.
   */
  async listInsights(filters: AdminAIInsightsFilters = {}): Promise<AdminAIInsightsList> {
    const response = await this.#http.get<AdminAIInsightsListResponseDto>("/admin/ai/insights", {
      params: buildListInsightsParams(filters),
    });
    const payload = unwrapData(response.data);

    return {
      items: (payload.items ?? []).map(mapSummary),
      page: payload.page ?? filters.page ?? 1,
      perPage: payload.per_page ?? filters.perPage ?? 20,
      total: payload.total ?? payload.items?.length ?? 0,
      kpis: mapKpis(payload.kpis),
    };
  }

  /**
   * Loads one AI insight with redacted evidence and audit trail.
   *
   * @param insightId Insight identifier.
   * @returns Insight detail.
   */
  async getInsight(insightId: string): Promise<AdminAIInsightDetail> {
    const response = await this.#http.get<AdminAIInsightDetailResponseDto>(
      `/admin/ai/insights/${insightId}`,
    );
    return mapDetail(unwrapData(response.data));
  }
}

/**
 * Creates the default admin AI insights client for Vue setup contexts.
 *
 * @returns Configured admin AI insights client.
 */
export const useAdminInsightsClient = (): AdminInsightsClient =>
  new AdminInsightsClient(useHttp());
