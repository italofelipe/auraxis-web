export interface AdminImpersonationUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly planCode: string;
}

export interface AdminImpersonationSession {
  readonly sessionId: string;
  readonly auditId: string | null;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly startedAt: string;
  readonly expiresAt: string;
  readonly readOnly: true;
}

export interface StartAdminImpersonationInput {
  readonly userId: string;
  readonly reason: string;
}

export interface AdminImpersonationSearchResult {
  readonly users: readonly AdminImpersonationUser[];
}
