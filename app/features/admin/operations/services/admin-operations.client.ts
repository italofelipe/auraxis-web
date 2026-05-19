import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AdminFeatureFlag,
  AdminFeatureFlagList,
  AdminFeatureFlagStatus,
  AdminFeatureFlagUpdateInput,
  AdminFeatureFlagUpdateResult,
  AdminOperationsQueue,
  AdminOperationsSummary,
} from "~/features/admin/operations/model/admin-operations";
import {
  normalizeDateTime,
  unwrapData,
  type V2EnvelopeDto,
} from "~/features/admin/shared/admin-api";

interface AdminFeatureFlagDto {
  readonly key: string;
  readonly owner?: string | null;
  readonly type?: string | null;
  readonly status?: string | null;
  readonly description?: string | null;
  readonly remove_by?: string | null;
  readonly repositories?: readonly string[] | null;
  readonly updated_at?: string | null;
}

interface AdminFeatureFlagListDto {
  readonly flags?: readonly AdminFeatureFlagDto[] | null;
}

interface AdminFeatureFlagUpdateDto {
  readonly audit_id?: string | null;
  readonly flag?: AdminFeatureFlagDto | null;
}

interface AdminOperationsQueueDto {
  readonly name?: string | null;
  readonly pending?: number | null;
  readonly oldest_age_seconds?: number | null;
}

interface AdminOperationsSummaryDto {
  readonly api_status?: AdminOperationsSummary["apiStatus"] | string | null;
  readonly ai_circuit_breaker?: AdminOperationsSummary["aiCircuitBreaker"] | string | null;
  readonly monthly_ai_cost_usd?: number | null;
  readonly monthly_ai_budget_usd?: number | null;
  readonly pending_incidents?: number | null;
  readonly grafana_url?: string | null;
  readonly last_sync_at?: string | null;
  readonly queues?: readonly AdminOperationsQueueDto[] | null;
}

type AdminFeatureFlagListResponseDto = AdminFeatureFlagListDto | V2EnvelopeDto<AdminFeatureFlagListDto>;
type AdminFeatureFlagUpdateResponseDto =
  | AdminFeatureFlagUpdateDto
  | V2EnvelopeDto<AdminFeatureFlagUpdateDto>;
type AdminOperationsSummaryResponseDto =
  | AdminOperationsSummaryDto
  | V2EnvelopeDto<AdminOperationsSummaryDto>;

/**
 * Normalizes feature flag status values.
 *
 * @param value Raw status from the API.
 * @returns Supported feature flag status with a draft default.
 */
const toFlagStatus = (value: string | null | undefined): AdminFeatureFlagStatus => {
  switch (value) {
    case "draft":
    case "enabled-dev":
    case "enabled-staging":
    case "enabled-prod":
    case "disabled":
    case "sunset":
      return value;
    default:
      return "draft";
  }
};

/**
 * Normalizes the API health status.
 *
 * @param value Raw health status from the API.
 * @returns Supported API health status.
 */
const toApiStatus = (
  value: string | null | undefined,
): AdminOperationsSummary["apiStatus"] => {
  switch (value) {
    case "healthy":
    case "degraded":
    case "down":
      return value;
    default:
      return "degraded";
  }
};

/**
 * Normalizes the AI circuit breaker state.
 *
 * @param value Raw circuit breaker state from the API.
 * @returns Supported circuit breaker state.
 */
const toCircuitBreaker = (
  value: string | null | undefined,
): AdminOperationsSummary["aiCircuitBreaker"] => {
  switch (value) {
    case "open":
    case "closed":
    case "half_open":
      return value;
    default:
      return "closed";
  }
};

/**
 * Maps one feature flag payload into the admin UI model.
 *
 * @param flag Raw feature flag payload returned by the API.
 * @returns UI-ready feature flag.
 */
const mapFlag = (flag: AdminFeatureFlagDto): AdminFeatureFlag => ({
  key: flag.key,
  owner: flag.owner ?? "platform",
  type: flag.type ?? "release",
  status: toFlagStatus(flag.status),
  description: flag.description ?? "Sem descrição operacional.",
  removeBy: flag.remove_by ?? null,
  repositories: flag.repositories ?? [],
  updatedAt: normalizeDateTime(flag.updated_at),
});

/**
 * Maps one operations queue payload into the admin UI model.
 *
 * @param queue Raw queue payload returned by the API.
 * @returns UI-ready queue summary.
 */
const mapQueue = (queue: AdminOperationsQueueDto): AdminOperationsQueue => ({
  name: queue.name ?? "fila",
  pending: queue.pending ?? 0,
  oldestAgeSeconds: queue.oldest_age_seconds ?? 0,
});

/**
 * Maps the operations summary payload into the admin UI model.
 *
 * @param summary Raw operations summary payload returned by the API.
 * @returns UI-ready operations summary.
 */
const mapSummary = (summary: AdminOperationsSummaryDto): AdminOperationsSummary => ({
  apiStatus: toApiStatus(summary.api_status),
  aiCircuitBreaker: toCircuitBreaker(summary.ai_circuit_breaker),
  monthlyAiCostUsd: summary.monthly_ai_cost_usd ?? 0,
  monthlyAiBudgetUsd: summary.monthly_ai_budget_usd ?? 0,
  pendingIncidents: summary.pending_incidents ?? 0,
  grafanaUrl: summary.grafana_url ?? null,
  lastSyncAt: normalizeDateTime(summary.last_sync_at),
  queues: (summary.queues ?? []).map(mapQueue),
});

export class AdminOperationsClient {
  readonly #http: AxiosInstance;

  /**
   * Creates an admin operations client.
   *
   * @param http Configured Axios instance.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Lists feature flags visible to the admin console.
   *
   * @returns Feature flags and rollout metadata.
   */
  async listFeatureFlags(): Promise<AdminFeatureFlagList> {
    const response = await this.#http.get<AdminFeatureFlagListResponseDto>(
      "/admin/feature-flags",
    );
    const payload = unwrapData(response.data);

    return {
      flags: (payload.flags ?? []).map(mapFlag),
    };
  }

  /**
   * Updates a feature flag status with an audit reason.
   *
   * @param input Target flag, next status and audit reason.
   * @returns Updated flag and audit identifier.
   */
  async updateFeatureFlag(
    input: AdminFeatureFlagUpdateInput,
  ): Promise<AdminFeatureFlagUpdateResult> {
    const response = await this.#http.patch<AdminFeatureFlagUpdateResponseDto>(
      `/admin/feature-flags/${encodeURIComponent(input.key)}`,
      {
        status: input.status,
        reason: input.reason,
      },
    );
    const payload = unwrapData(response.data);

    return {
      auditId: payload.audit_id ?? null,
      flag: mapFlag(payload.flag ?? {
        key: input.key,
        status: input.status,
      }),
    };
  }

  /**
   * Loads the operational health summary for the admin console.
   *
   * @returns Operational summary with queues and Grafana link.
   */
  async getOperationalSummary(): Promise<AdminOperationsSummary> {
    const response = await this.#http.get<AdminOperationsSummaryResponseDto>(
      "/admin/operations/summary",
    );
    return mapSummary(unwrapData(response.data));
  }
}

/**
 * Creates the default admin operations client for Vue setup contexts.
 *
 * @returns Configured admin operations client.
 */
export const useAdminOperationsClient = (): AdminOperationsClient =>
  new AdminOperationsClient(useHttp());
