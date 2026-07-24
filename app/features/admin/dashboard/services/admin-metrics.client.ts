import type { AxiosInstance } from "axios";

import { unwrapData } from "~/features/admin/shared/admin-api";
import { useAdminHttp } from "~/features/admin/shared/admin-http";
import type {
  AdminActivityMetrics,
  AdminAiBreakdown,
  AdminAiBreakdownBy,
  AdminAiBreakdownRow,
  AdminAiMetrics,
  AdminMetricsBlock,
  AdminMetricsInterval,
  AdminMetricsOverview,
  AdminMetricsTimeseries,
  AdminPremiumMetrics,
  AdminTimeseriesPoint,
  AdminUsersMetrics,
} from "~/features/admin/dashboard/model/admin-metrics";

interface AdminMetricsOverviewDto {
  readonly generated_at: string;
  readonly cache: { readonly hit: boolean; readonly ttl_seconds: number };
  readonly users: {
    readonly total: number;
    readonly verified: number;
    readonly blocked: number;
    readonly new_7d: number;
    readonly new_30d: number;
    readonly active_7d: number;
    readonly active_30d: number;
    readonly active_source: string;
  };
  readonly premium: {
    readonly subscriptions_active: number;
    readonly trials_active: number;
    readonly overrides_active: number;
    readonly entitled_users: number;
    readonly new_subscriptions_30d: number;
    readonly conversion_pct: number;
  };
  readonly ai: {
    readonly calls_7d: number;
    readonly tokens_7d: number;
    readonly cost_usd_7d: number;
    readonly cost_usd_mtd: number;
    readonly avg_latency_ms_7d: number;
    readonly active_users_7d: number;
  };
  readonly activity: {
    readonly transactions_7d: number;
    readonly goal_contributions_7d: number;
    readonly goals_created_7d: number;
    readonly budgets_active: number;
    readonly simulations_7d: number;
    readonly insight_runs_7d: number;
  };
}

/** Timeseries points arrive flat: `date` plus one numeric field per metric. */
type AdminTimeseriesPointDto = { readonly date: string } & Record<string, unknown>;

interface AdminMetricsTimeseriesDto {
  readonly block: AdminMetricsBlock;
  readonly interval: AdminMetricsInterval;
  readonly points: readonly AdminTimeseriesPointDto[];
}

interface AdminAiBreakdownRowDto {
  readonly key: string;
  readonly user_email?: string | null;
  readonly calls: number;
  readonly tokens: number;
  readonly cost_usd: number;
  readonly avg_latency_ms: number;
}

interface AdminAiBreakdownDto {
  readonly by: AdminAiBreakdownBy;
  readonly rows: readonly AdminAiBreakdownRowDto[];
}

/** Filters accepted by the timeseries endpoint. */
export interface AdminMetricsTimeseriesParams {
  readonly from: string;
  readonly to: string;
  readonly interval: AdminMetricsInterval;
}

/** Filters accepted by the AI breakdown endpoint. */
export interface AdminAiBreakdownParams {
  readonly by: AdminAiBreakdownBy;
  readonly limit?: number;
}

/**
 * @param dto Users block DTO.
 * @returns Domain users metrics.
 */
const mapUsers = (dto: AdminMetricsOverviewDto["users"]): AdminUsersMetrics => ({
  total: dto.total,
  verified: dto.verified,
  blocked: dto.blocked,
  new7d: dto.new_7d,
  new30d: dto.new_30d,
  active7d: dto.active_7d,
  active30d: dto.active_30d,
  activeSource: dto.active_source,
});

/**
 * @param dto Premium block DTO.
 * @returns Domain premium metrics.
 */
const mapPremium = (dto: AdminMetricsOverviewDto["premium"]): AdminPremiumMetrics => ({
  subscriptionsActive: dto.subscriptions_active,
  trialsActive: dto.trials_active,
  overridesActive: dto.overrides_active,
  entitledUsers: dto.entitled_users,
  newSubscriptions30d: dto.new_subscriptions_30d,
  conversionPct: dto.conversion_pct,
});

/**
 * @param dto AI block DTO.
 * @returns Domain AI metrics.
 */
const mapAi = (dto: AdminMetricsOverviewDto["ai"]): AdminAiMetrics => ({
  calls7d: dto.calls_7d,
  tokens7d: dto.tokens_7d,
  costUsd7d: dto.cost_usd_7d,
  costUsdMtd: dto.cost_usd_mtd,
  avgLatencyMs7d: dto.avg_latency_ms_7d,
  activeUsers7d: dto.active_users_7d,
});

/**
 * @param dto Activity block DTO.
 * @returns Domain activity metrics.
 */
const mapActivity = (dto: AdminMetricsOverviewDto["activity"]): AdminActivityMetrics => ({
  transactions7d: dto.transactions_7d,
  goalContributions7d: dto.goal_contributions_7d,
  goalsCreated7d: dto.goals_created_7d,
  budgetsActive: dto.budgets_active,
  simulations7d: dto.simulations_7d,
  insightRuns7d: dto.insight_runs_7d,
});

/**
 * @param dto Flat timeseries point.
 * @returns Domain point with numeric metrics keyed by contract field name.
 */
const mapPoint = (dto: AdminTimeseriesPointDto): AdminTimeseriesPoint => {
  const values: Record<string, number> = {};

  for (const [key, value] of Object.entries(dto)) {
    if (key !== "date" && typeof value === "number") {
      values[key] = value;
    }
  }

  return { date: dto.date, values };
};

/**
 * @param dto Breakdown row DTO.
 * @returns Domain breakdown row.
 */
const mapBreakdownRow = (dto: AdminAiBreakdownRowDto): AdminAiBreakdownRow => ({
  key: dto.key,
  userEmail: dto.user_email ?? null,
  calls: dto.calls,
  tokens: dto.tokens,
  costUsd: dto.cost_usd,
  avgLatencyMs: dto.avg_latency_ms,
});

export class AdminMetricsClient {
  readonly #http: AxiosInstance;

  /** @param http Dedicated FastAPI admin client. */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /** @returns Aggregated product metrics for the four dashboard blocks. */
  async getOverview(): Promise<AdminMetricsOverview> {
    const response = await this.#http.get<AdminMetricsOverviewDto>("/v2/admin/metrics/overview");
    const dto = unwrapData(response.data);

    return {
      generatedAt: dto.generated_at,
      cache: { hit: dto.cache.hit, ttlSeconds: dto.cache.ttl_seconds },
      users: mapUsers(dto.users),
      premium: mapPremium(dto.premium),
      ai: mapAi(dto.ai),
      activity: mapActivity(dto.activity),
    };
  }

  /**
   * @param block Metric block to query.
   * @param params Inclusive date window and aggregation interval.
   * @returns Dated points for the requested block.
   */
  async getTimeseries(
    block: AdminMetricsBlock,
    params: AdminMetricsTimeseriesParams,
  ): Promise<AdminMetricsTimeseries> {
    const response = await this.#http.get<AdminMetricsTimeseriesDto>(
      `/v2/admin/metrics/${block}/timeseries`,
      { params: { from: params.from, to: params.to, interval: params.interval } },
    );
    const dto = unwrapData(response.data);

    return { block: dto.block, interval: dto.interval, points: dto.points.map(mapPoint) };
  }

  /**
   * @param params Breakdown dimension and row limit.
   * @returns AI usage rows aggregated by the requested dimension.
   */
  async getAiBreakdown(params: AdminAiBreakdownParams): Promise<AdminAiBreakdown> {
    const response = await this.#http.get<AdminAiBreakdownDto>("/v2/admin/metrics/ai/breakdown", {
      params: { by: params.by, limit: params.limit ?? 20 },
    });
    const dto = unwrapData(response.data);

    return { by: dto.by, rows: dto.rows.map(mapBreakdownRow) };
  }
}

/** @returns Admin metrics client bound to the FastAPI HTTP adapter. */
export const useAdminMetricsClient = (): AdminMetricsClient =>
  new AdminMetricsClient(useAdminHttp());
