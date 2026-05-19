import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AdminImpersonationSearchResult,
  AdminImpersonationSession,
  AdminImpersonationUser,
  StartAdminImpersonationInput,
} from "~/features/admin/impersonation/model/admin-impersonation";
import { unwrapData, type V2EnvelopeDto } from "~/features/admin/shared/admin-api";

interface AdminImpersonationUserDto {
  readonly id: string;
  readonly name?: string | null;
  readonly email?: string | null;
  readonly subscription?: {
    readonly plan_code?: string | null;
  } | null;
}

interface AdminImpersonationSearchDto {
  readonly users?: readonly AdminImpersonationUserDto[] | null;
}

interface AdminImpersonationSessionDto {
  readonly session_id?: string | null;
  readonly audit_id?: string | null;
  readonly user_id?: string | null;
  readonly user_name?: string | null;
  readonly user_email?: string | null;
  readonly started_at?: string | null;
  readonly expires_at?: string | null;
  readonly read_only?: boolean | null;
}

type AdminImpersonationSearchResponseDto =
  | AdminImpersonationSearchDto
  | V2EnvelopeDto<AdminImpersonationSearchDto>;
type AdminImpersonationSessionResponseDto =
  | AdminImpersonationSessionDto
  | V2EnvelopeDto<AdminImpersonationSessionDto>;

/**
 * Maps one admin user result for the impersonation picker.
 *
 * @param user Raw user payload returned by the API.
 * @returns UI-ready impersonation user.
 */
const mapUser = (user: AdminImpersonationUserDto): AdminImpersonationUser => ({
  id: user.id,
  name: user.name ?? "Usuário sem nome",
  email: user.email ?? "sem-email@auraxis.local",
  planCode: user.subscription?.plan_code ?? "free",
});

/**
 * Maps a read-only impersonation session.
 *
 * @param session Raw session payload returned by the API.
 * @returns UI-ready impersonation session.
 */
const mapSession = (session: AdminImpersonationSessionDto): AdminImpersonationSession => ({
  sessionId: session.session_id ?? "local-session",
  auditId: session.audit_id ?? null,
  userId: session.user_id ?? "unknown",
  userName: session.user_name ?? "Usuário",
  userEmail: session.user_email ?? "sem-email@auraxis.local",
  startedAt: session.started_at ?? new Date().toISOString(),
  expiresAt: session.expires_at ?? new Date(Date.now() + 15 * 60_000).toISOString(),
  readOnly: true,
});

export class AdminImpersonationClient {
  readonly #http: AxiosInstance;

  /**
   * Creates an admin impersonation client.
   *
   * @param http Configured Axios instance.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Searches users eligible for read-only impersonation.
   *
   * @param search Search text typed by the admin.
   * @returns Matching users.
   */
  async searchUsers(search: string): Promise<AdminImpersonationSearchResult> {
    const response = await this.#http.get<AdminImpersonationSearchResponseDto>(
      "/admin/users",
      { params: { q: search, page: 1, per_page: 10 } },
    );
    const payload = unwrapData(response.data);

    return {
      users: (payload.users ?? []).map(mapUser),
    };
  }

  /**
   * Starts a read-only impersonation session.
   *
   * @param input Target user and audit reason.
   * @returns Created impersonation session.
   */
  async startSession(input: StartAdminImpersonationInput): Promise<AdminImpersonationSession> {
    const response = await this.#http.post<AdminImpersonationSessionResponseDto>(
      "/admin/impersonation/sessions",
      {
        user_id: input.userId,
        reason: input.reason,
        mode: "read_only",
      },
    );
    return mapSession(unwrapData(response.data));
  }

  /**
   * Ends a read-only impersonation session.
   *
   * @param sessionId Session identifier returned by the API.
   * @returns Nothing.
   */
  async endSession(sessionId: string): Promise<void> {
    await this.#http.delete(`/admin/impersonation/sessions/${sessionId}`);
  }
}

/**
 * Creates the default admin impersonation client for Vue setup contexts.
 *
 * @returns Configured admin impersonation client.
 */
export const useAdminImpersonationClient = (): AdminImpersonationClient =>
  new AdminImpersonationClient(useHttp());
