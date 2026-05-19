export type AdminAIInsightStatus = "generated" | "cached" | "failed" | "rejected" | "running";
export type AdminAIConsentStatus = "granted" | "revoked" | "missing";
export type AdminAIInsightRiskLevel = "low" | "medium" | "high";

export interface AdminAIInsightAuditEvent {
  readonly id: string;
  readonly action: string;
  readonly createdAt: string | null;
  readonly actorEmail: string | null;
}

export interface AdminAIInsightSummary {
  readonly id: string;
  readonly userId: string;
  readonly userEmail: string;
  readonly periodLabel: string;
  readonly status: AdminAIInsightStatus;
  readonly model: string;
  readonly tokensUsed: number;
  readonly costUsd: number;
  readonly latencyMs: number | null;
  readonly consentStatus: AdminAIConsentStatus;
  readonly evidenceCount: number;
  readonly riskLevel: AdminAIInsightRiskLevel;
  readonly dataQuality: string;
  readonly createdAt: string | null;
}

export interface AdminAIInsightDetail extends AdminAIInsightSummary {
  readonly summary: string;
  readonly promptTemplateVersion: string;
  readonly snapshotHash: string | null;
  readonly redactedEvidence: readonly string[];
  readonly auditEvents: readonly AdminAIInsightAuditEvent[];
}

export interface AdminAIInsightKpis {
  readonly totalCostUsd: number;
  readonly totalTokens: number;
  readonly failedCount: number;
  readonly missingConsentCount: number;
}

export interface AdminAIInsightsList {
  readonly items: readonly AdminAIInsightSummary[];
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  readonly kpis: AdminAIInsightKpis;
}

export interface AdminAIInsightsFilters {
  readonly search?: string;
  readonly status?: AdminAIInsightStatus | "all";
  readonly model?: string;
  readonly page?: number;
  readonly perPage?: number;
}

export const ADMIN_AI_INSIGHT_STATUS_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "Gerado", value: "generated" },
  { label: "Cache", value: "cached" },
  { label: "Falha", value: "failed" },
  { label: "Rejeitado", value: "rejected" },
  { label: "Rodando", value: "running" },
] as const;
