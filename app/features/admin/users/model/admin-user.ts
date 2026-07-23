export type AdminUserSource = "v1" | "v2";
export type AdminUserStatus = "active" | "blocked";
export type AdminActionStatus = "pending" | "applied" | "partial" | "failed";
export type AdminUserActionKind =
  | "block"
  | "unblock"
  | "premium-override"
  | "premium-override-revoke";

export interface AdminUserIdentity {
  readonly source: AdminUserSource;
  readonly userId: string;
  readonly email: string;
  readonly emailVerified: boolean;
  readonly authMethods: string[];
  readonly createdAt: string;
  readonly lastLoginAt: string | null;
  readonly blockedAt: string | null;
  readonly blockedReason: string | null;
  readonly blockedBy: string | null;
  readonly subscriptionStatus: string | null;
  readonly premiumOverrideActive: boolean;
  readonly premiumOverrideExpiresAt: string | null;
}

export interface AdminUserSummary {
  /** Canonical backend reference, e.g. `v1/<uuid>`. */
  readonly id: string;
  readonly source: AdminUserSource;
  readonly userId: string;
  readonly email: string;
  readonly status: AdminUserStatus;
  readonly createdAt: string | null;
  readonly lastSeenAt: string | null;
  readonly premium: boolean;
  readonly premiumOverrideActive: boolean;
  readonly sources: AdminUserSource[];
}

export interface AdminAuditEvent {
  readonly id: string;
  readonly action: string;
  readonly status: AdminActionStatus;
  readonly reason: string;
  readonly actor: string;
  readonly createdAt: string;
}

export interface AdminUserDetail extends AdminUserSummary {
  readonly identities: AdminUserIdentity[];
  readonly auditEvents: AdminAuditEvent[];
}

export interface AdminUserList {
  readonly users: AdminUserSummary[];
  readonly nextCursor: string | null;
}

export interface AdminUsersFilters {
  readonly search?: string;
  readonly cursor?: string | null;
  readonly limit?: number;
  readonly status?: AdminUserStatus;
  readonly source?: AdminUserSource;
  readonly premium?: boolean;
}

export interface AdminUserMutationInput {
  readonly userRef: string;
  readonly reason: string;
  readonly expiresAt?: string | null;
}

export interface AdminUserMutationResult {
  readonly actionId: string;
  readonly status: AdminActionStatus;
}

export interface AdminSession {
  readonly source: AdminUserSource;
  readonly userId: string;
  readonly email: string;
  readonly isAdmin: boolean;
}
