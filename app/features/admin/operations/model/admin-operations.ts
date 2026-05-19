export type AdminFeatureFlagStatus =
  | "draft"
  | "enabled-dev"
  | "enabled-staging"
  | "enabled-prod"
  | "disabled"
  | "sunset";

export interface AdminFeatureFlag {
  readonly key: string;
  readonly owner: string;
  readonly type: string;
  readonly status: AdminFeatureFlagStatus;
  readonly description: string;
  readonly removeBy: string | null;
  readonly repositories: readonly string[];
  readonly updatedAt: string | null;
}

export interface AdminFeatureFlagList {
  readonly flags: readonly AdminFeatureFlag[];
}

export interface AdminFeatureFlagUpdateInput {
  readonly key: string;
  readonly status: AdminFeatureFlagStatus;
  readonly reason: string;
}

export interface AdminFeatureFlagUpdateResult {
  readonly auditId: string | null;
  readonly flag: AdminFeatureFlag;
}

export interface AdminOperationsQueue {
  readonly name: string;
  readonly pending: number;
  readonly oldestAgeSeconds: number;
}

export interface AdminOperationsSummary {
  readonly apiStatus: "healthy" | "degraded" | "down";
  readonly aiCircuitBreaker: "open" | "closed" | "half_open";
  readonly monthlyAiCostUsd: number;
  readonly monthlyAiBudgetUsd: number;
  readonly pendingIncidents: number;
  readonly grafanaUrl: string | null;
  readonly lastSyncAt: string | null;
  readonly queues: readonly AdminOperationsQueue[];
}

export const ADMIN_FEATURE_FLAG_STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Dev", value: "enabled-dev" },
  { label: "Staging", value: "enabled-staging" },
  { label: "Produção", value: "enabled-prod" },
  { label: "Desligada", value: "disabled" },
  { label: "Sunset", value: "sunset" },
] as const;
