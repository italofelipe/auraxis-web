import type { AxiosInstance } from "axios";

import { useAdminHttp } from "~/features/admin/shared/admin-http";
import type {
  AdminActionStatus,
  AdminAuditEvent,
  AdminSession,
  AdminUserDetail,
  AdminUserIdentity,
  AdminUserList,
  AdminUserMutationInput,
  AdminUserMutationResult,
  AdminUsersFilters,
  AdminUserSource,
  AdminUserSummary,
} from "~/features/admin/users/model/admin-user";

interface AdminIdentityDto {
  readonly source: AdminUserSource;
  readonly user_id: string;
  readonly email: string;
  readonly email_verified: boolean;
  readonly auth_methods: string[];
  readonly created_at: string;
  readonly last_login_at?: string | null;
  readonly blocked_at?: string | null;
  readonly blocked_reason?: string | null;
  readonly blocked_by?: string | null;
  readonly subscription_status?: string | null;
  readonly premium_override_active: boolean;
  readonly premium_override_expires_at?: string | null;
}

interface AdminUserDto {
  readonly source: AdminUserSource;
  readonly user_id: string;
  readonly email: string;
  readonly identities: AdminIdentityDto[];
  readonly blocked: boolean;
  readonly premium: boolean;
}

interface AdminActionDto {
  readonly id: string;
  readonly action_type: string;
  readonly status: AdminActionStatus;
  readonly actor: string;
  readonly reason: string;
  readonly created_at: string;
}

interface AdminUserDetailDto extends AdminUserDto {
  readonly recent_actions: AdminActionDto[];
}

interface AdminUserListDto {
  readonly items: AdminUserDto[];
  readonly next_cursor?: string | null;
}

interface AdminSessionDto {
  readonly source: AdminUserSource;
  readonly user_id: string;
  readonly email: string;
  readonly is_admin: boolean;
}

/**
 * @param source Identity source.
 * @param userId Source-local id.
 * @returns Stable canonical reference used by routes and query keys.
 */
const identityRef = (source: AdminUserSource, userId: string): string => `${source}/${userId}`;

/**
 * @param identity FastAPI source identity.
 * @returns UI identity contract.
 */
const mapIdentity = (identity: AdminIdentityDto): AdminUserIdentity => ({
  source: identity.source,
  userId: identity.user_id,
  email: identity.email,
  emailVerified: identity.email_verified,
  authMethods: identity.auth_methods,
  createdAt: identity.created_at,
  lastLoginAt: identity.last_login_at ?? null,
  blockedAt: identity.blocked_at ?? null,
  blockedReason: identity.blocked_reason ?? null,
  blockedBy: identity.blocked_by ?? null,
  subscriptionStatus: identity.subscription_status ?? null,
  premiumOverrideActive: identity.premium_override_active,
  premiumOverrideExpiresAt: identity.premium_override_expires_at ?? null,
});

/**
 * @param values Candidate timestamps.
 * @returns Earliest non-null ISO timestamp.
 */
const earliest = (values: Array<string | null | undefined>): string | null =>
  values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b))[0] ?? null;

/**
 * @param values Candidate timestamps.
 * @returns Latest non-null ISO timestamp.
 */
const latest = (values: Array<string | null | undefined>): string | null =>
  values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b))
    .at(-1) ?? null;

/**
 * @param user Unified backend person.
 * @returns Compact list row.
 */
const mapSummary = (user: AdminUserDto): AdminUserSummary => ({
  id: identityRef(user.source, user.user_id),
  source: user.source,
  userId: user.user_id,
  email: user.email,
  status: user.blocked ? "blocked" : "active",
  createdAt: earliest(user.identities.map((identity) => identity.created_at)),
  lastSeenAt: latest(user.identities.map((identity) => identity.last_login_at)),
  premium: user.premium,
  premiumOverrideActive: user.identities.some((identity) => identity.premium_override_active),
  sources: [...new Set(user.identities.map((identity) => identity.source))],
});

/**
 * @param action Durable backend action.
 * @returns Audit timeline event.
 */
const mapAudit = (action: AdminActionDto): AdminAuditEvent => ({
  id: action.id,
  action: action.action_type,
  status: action.status,
  reason: action.reason,
  actor: action.actor,
  createdAt: action.created_at,
});

/**
 * @param userRef Canonical user reference.
 * @returns Validated source and source-local id.
 */
const parseRef = (userRef: string): [AdminUserSource, string] => {
  const [source, userId, ...rest] = userRef.split("/");
  if ((source !== "v1" && source !== "v2") || !userId || rest.length > 0) {
    throw new Error("Referência de usuário administrativa inválida.");
  }
  return [source, userId];
};

/** @returns Cryptographically random idempotency key for one operator click. */
const idempotencyKey = (): string => `admin-web-${globalThis.crypto.randomUUID()}`;

export class AdminUsersClient {
  readonly #http: AxiosInstance;

  /** @param http Dedicated FastAPI admin client. */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /** @returns Backend-validated administrative session. */
  async getSession(): Promise<AdminSession> {
    const response = await this.#http.get<AdminSessionDto>("/v2/admin/session");
    return {
      source: response.data.source,
      userId: response.data.user_id,
      email: response.data.email,
      isAdmin: response.data.is_admin,
    };
  }

  /**
   * @param filters Federated list filters.
   * @returns One cursor-based page of unified users.
   */
  async listUsers(filters: AdminUsersFilters = {}): Promise<AdminUserList> {
    const response = await this.#http.get<AdminUserListDto>("/v2/admin/users", {
      params: {
        q: filters.search || undefined,
        cursor: filters.cursor || undefined,
        limit: filters.limit ?? 25,
        status: filters.status,
        source: filters.source,
        premium: filters.premium,
      },
    });
    return {
      users: response.data.items.map(mapSummary),
      nextCursor: response.data.next_cursor ?? null,
    };
  }

  /**
   * @param userRef Canonical target reference.
   * @returns Operational detail for the canonical user reference.
   */
  async getUser(userRef: string): Promise<AdminUserDetail> {
    const [source, userId] = parseRef(userRef);
    const response = await this.#http.get<AdminUserDetailDto>(
      `/v2/admin/users/${source}/${encodeURIComponent(userId)}`,
    );
    return {
      ...mapSummary(response.data),
      identities: response.data.identities.map(mapIdentity),
      auditEvents: response.data.recent_actions.map(mapAudit),
    };
  }

  /**
   * @param input Audited mutation input.
   * @returns The audited total-block action.
   */
  async blockUser(input: AdminUserMutationInput): Promise<AdminUserMutationResult> {
    return this.#mutate(input, "block");
  }

  /**
   * @param input Audited mutation input.
   * @returns The audited unblock action.
   */
  async unblockUser(input: AdminUserMutationInput): Promise<AdminUserMutationResult> {
    return this.#mutate(input, "unblock");
  }

  /**
   * @param input Audited mutation input.
   * @returns The audited premium grant action.
   */
  async grantPremiumOverride(input: AdminUserMutationInput): Promise<AdminUserMutationResult> {
    return this.#mutate(input, "premium-override");
  }

  /**
   * @param input Audited mutation input.
   * @returns The audited premium revoke action.
   */
  async revokePremiumOverride(input: AdminUserMutationInput): Promise<AdminUserMutationResult> {
    return this.#mutate(input, "premium-override/revoke");
  }

  /**
   * Sends one action with a unique idempotency key.
   *
   * @param input Audited mutation input.
   * @param action REST action suffix.
   * @returns Persisted action reference and status.
   */
  async #mutate(
    input: AdminUserMutationInput,
    action: "block" | "unblock" | "premium-override" | "premium-override/revoke",
  ): Promise<AdminUserMutationResult> {
    const [source, userId] = parseRef(input.userRef);
    const response = await this.#http.post<AdminActionDto>(
      `/v2/admin/users/${source}/${encodeURIComponent(userId)}/${action}`,
      {
        reason: input.reason,
        ...(action === "premium-override" ? { expires_at: input.expiresAt ?? null } : {}),
      },
      { headers: { "Idempotency-Key": idempotencyKey() } },
    );
    return { actionId: response.data.id, status: response.data.status };
  }
}

/** @returns Admin users client bound to the FastAPI HTTP adapter. */
export const useAdminUsersClient = (): AdminUsersClient => new AdminUsersClient(useAdminHttp());
