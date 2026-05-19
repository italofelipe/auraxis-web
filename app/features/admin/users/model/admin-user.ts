export type AdminUserStatus = "active" | "blocked" | "pending" | "deleted";

export type AdminSubscriptionStatus =
  | "active"
  | "free"
  | "trialing"
  | "past_due"
  | "canceled"
  | "inactive";

export interface AdminUserSummary {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly status: AdminUserStatus;
  readonly createdAt: string | null;
  readonly lastSeenAt: string | null;
  readonly subscriptionPlan: string;
  readonly subscriptionStatus: AdminSubscriptionStatus;
  readonly entitlementCount: number;
}

export interface AdminUserList {
  readonly users: AdminUserSummary[];
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
}

export interface AdminUserSubscription {
  readonly planCode: string;
  readonly status: AdminSubscriptionStatus;
  readonly billingCycle: string | null;
  readonly currentPeriodEnd: string | null;
}

export interface AdminUserEntitlement {
  readonly id: string;
  readonly featureKey: string;
  readonly label: string;
  readonly active: boolean;
  readonly grantedAt: string | null;
  readonly expiresAt: string | null;
}

export interface AdminAuditEvent {
  readonly id: string;
  readonly action: string;
  readonly reason: string | null;
  readonly createdAt: string | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  readonly subscription: AdminUserSubscription | null;
  readonly entitlements: AdminUserEntitlement[];
  readonly auditEvents: AdminAuditEvent[];
}

export interface AdminUsersFilters {
  readonly search?: string;
  readonly page?: number;
  readonly perPage?: number;
}

export interface GrantAdminEntitlementInput {
  readonly userId: string;
  readonly featureKey: string;
  readonly reason: string;
}

export interface RevokeAdminEntitlementInput {
  readonly entitlementId: string;
  readonly reason: string;
}

export interface AdminEntitlementMutationResult {
  readonly auditId: string | null;
  readonly entitlement?: AdminUserEntitlement;
}

export const ADMIN_ENTITLEMENT_OPTIONS = [
  {
    label: "Insights com IA",
    value: "ai_insights",
    description: "Permite geração e histórico de análises financeiras com IA.",
  },
  {
    label: "Simulações avançadas",
    value: "advanced_simulations",
    description: "Libera calculadoras e cenários premium.",
  },
  {
    label: "Market Pulse",
    value: "market_pulse",
    description: "Habilita painéis e sinais de mercado na carteira.",
  },
  {
    label: "Recursos premium",
    value: "premium_features",
    description: "Atalho operacional para recursos premium gerais.",
  },
] as const;
