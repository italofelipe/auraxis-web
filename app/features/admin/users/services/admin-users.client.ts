import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AdminAuditEvent,
  AdminEntitlementMutationResult,
  AdminSubscriptionStatus,
  AdminUserDetail,
  AdminUserEntitlement,
  AdminUserList,
  AdminUsersFilters,
  AdminUserStatus,
  AdminUserSummary,
  GrantAdminEntitlementInput,
  RevokeAdminEntitlementInput,
} from "~/features/admin/users/model/admin-user";

interface AdminSubscriptionDto {
  readonly plan_code?: string | null;
  readonly status?: AdminSubscriptionStatus | string | null;
  readonly billing_cycle?: string | null;
  readonly current_period_end?: string | null;
}

interface AdminUserDto {
  readonly id: string;
  readonly name?: string | null;
  readonly email?: string | null;
  readonly status?: AdminUserStatus | string | null;
  readonly created_at?: string | null;
  readonly last_seen_at?: string | null;
  readonly subscription?: AdminSubscriptionDto | null;
  readonly entitlements_count?: number | null;
  readonly entitlements?: AdminEntitlementDto[] | null;
  readonly audit_events?: AdminAuditEventDto[] | null;
}

interface AdminEntitlementDto {
  readonly id: string;
  readonly feature_key?: string | null;
  readonly label?: string | null;
  readonly active?: boolean | null;
  readonly granted_at?: string | null;
  readonly expires_at?: string | null;
}

interface AdminAuditEventDto {
  readonly id: string;
  readonly action?: string | null;
  readonly reason?: string | null;
  readonly created_at?: string | null;
}

interface V2EnvelopeDto<T> {
  readonly data?: T | null;
}

interface AdminUsersListPayloadDto {
  readonly users?: AdminUserDto[] | null;
  readonly page?: number | null;
  readonly per_page?: number | null;
  readonly total?: number | null;
}

interface AdminUserDetailPayloadDto {
  readonly user?: AdminUserDto | null;
}

interface AdminEntitlementMutationPayloadDto {
  readonly audit_id?: string | null;
  readonly entitlement?: AdminEntitlementDto | null;
}

type AdminUsersListResponseDto =
  | AdminUsersListPayloadDto
  | V2EnvelopeDto<AdminUsersListPayloadDto>;

type AdminUserDetailResponseDto =
  | AdminUserDto
  | AdminUserDetailPayloadDto
  | V2EnvelopeDto<AdminUserDto | AdminUserDetailPayloadDto>;

type AdminEntitlementMutationResponseDto =
  | AdminEntitlementMutationPayloadDto
  | V2EnvelopeDto<AdminEntitlementMutationPayloadDto>;

const DEFAULT_USER_STATUS: AdminUserStatus = "pending";
const DEFAULT_SUBSCRIPTION_STATUS: AdminSubscriptionStatus = "inactive";

/**
 * Checks whether an unknown payload can be inspected as an object.
 *
 * @param value Candidate value.
 * @returns True for non-null object records.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

/**
 * Unwraps the standard API v2 data envelope while accepting flat payloads.
 *
 * @param payload Raw response body.
 * @returns Response data payload.
 */
const unwrapData = <T>(payload: T | V2EnvelopeDto<T>): T => {
  if (isRecord(payload) && "data" in payload && payload.data !== undefined && payload.data !== null) {
    return payload.data as T;
  }

  return payload as T;
};

/**
 * Normalizes unknown subscription statuses into the admin UI vocabulary.
 *
 * @param value Raw status value.
 * @returns Safe subscription status.
 */
const toSubscriptionStatus = (
  value: string | null | undefined,
): AdminSubscriptionStatus => {
  switch (value) {
    case "active":
    case "free":
    case "trialing":
    case "past_due":
    case "canceled":
    case "inactive":
      return value;
    default:
      return DEFAULT_SUBSCRIPTION_STATUS;
  }
};

/**
 * Normalizes unknown user statuses into the admin UI vocabulary.
 *
 * @param value Raw status value.
 * @returns Safe user status.
 */
const toUserStatus = (value: string | null | undefined): AdminUserStatus => {
  switch (value) {
    case "active":
    case "blocked":
    case "pending":
    case "deleted":
      return value;
    default:
      return DEFAULT_USER_STATUS;
  }
};

/**
 * Maps the backend subscription snapshot to the admin detail model.
 *
 * @param subscription Raw subscription DTO.
 * @returns Admin subscription view model or null.
 */
const mapSubscription = (
  subscription: AdminSubscriptionDto | null | undefined,
): AdminUserDetail["subscription"] => {
  if (!subscription) {
    return null;
  }

  return {
    planCode: subscription.plan_code ?? "free",
    status: toSubscriptionStatus(subscription.status),
    billingCycle: subscription.billing_cycle ?? null,
    currentPeriodEnd: subscription.current_period_end ?? null,
  };
};

/**
 * Maps a raw entitlement row to the admin entitlement view model.
 *
 * @param entitlement Raw entitlement DTO.
 * @returns Admin entitlement view model.
 */
const mapEntitlement = (entitlement: AdminEntitlementDto): AdminUserEntitlement => ({
  id: entitlement.id,
  featureKey: entitlement.feature_key ?? "unknown",
  label: entitlement.label ?? entitlement.feature_key ?? "Entitlement",
  active: entitlement.active === true,
  grantedAt: entitlement.granted_at ?? null,
  expiresAt: entitlement.expires_at ?? null,
});

/**
 * Maps an audit event returned by admin endpoints.
 *
 * @param event Raw audit event DTO.
 * @returns Admin audit event view model.
 */
const mapAuditEvent = (event: AdminAuditEventDto): AdminAuditEvent => ({
  id: event.id,
  action: event.action ?? "admin.action",
  reason: event.reason ?? null,
  createdAt: event.created_at ?? null,
});

/**
 * Maps a raw user row to the list summary model.
 *
 * @param user Raw user DTO.
 * @returns Admin user summary.
 */
const mapSummary = (user: AdminUserDto): AdminUserSummary => ({
  id: user.id,
  name: user.name ?? "Usuário sem nome",
  email: user.email ?? "sem-email@auraxis.local",
  status: toUserStatus(user.status),
  createdAt: user.created_at ?? null,
  lastSeenAt: user.last_seen_at ?? null,
  subscriptionPlan: user.subscription?.plan_code ?? "free",
  subscriptionStatus: toSubscriptionStatus(user.subscription?.status),
  entitlementCount: user.entitlements_count ?? user.entitlements?.length ?? 0,
});

/**
 * Maps a raw user detail payload to the detail view model.
 *
 * @param user Raw user DTO with detail fields.
 * @returns Admin user detail.
 */
const mapDetail = (user: AdminUserDto): AdminUserDetail => ({
  ...mapSummary(user),
  subscription: mapSubscription(user.subscription),
  entitlements: (user.entitlements ?? []).map(mapEntitlement),
  auditEvents: (user.audit_events ?? []).map(mapAuditEvent),
});

/**
 * Extracts the list payload from flat or enveloped responses.
 *
 * @param payload Raw list response body.
 * @returns User list payload.
 */
const unwrapList = (payload: AdminUsersListResponseDto): AdminUsersListPayloadDto =>
  unwrapData(payload);

/**
 * Extracts the user detail object from supported response shapes.
 *
 * @param payload Raw detail response body.
 * @returns User DTO.
 */
const unwrapDetail = (payload: AdminUserDetailResponseDto): AdminUserDto => {
  const data = unwrapData(payload);

  if (isRecord(data) && "user" in data && isRecord(data.user)) {
    return data.user as unknown as AdminUserDto;
  }

  return data as AdminUserDto;
};

/**
 * Extracts entitlement mutation metadata from response bodies.
 *
 * @param payload Raw mutation response body.
 * @returns Audit metadata and optional entitlement.
 */
const unwrapMutation = (
  payload: AdminEntitlementMutationResponseDto,
): AdminEntitlementMutationPayloadDto => unwrapData(payload);

export class AdminUsersClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Lists users for the admin console.
   *
   * @param filters Search and pagination filters.
   * @returns Paginated user summaries.
   */
  async listUsers(filters: AdminUsersFilters = {}): Promise<AdminUserList> {
    const response = await this.#http.get<AdminUsersListResponseDto>("/admin/users", {
      params: {
        q: filters.search,
        page: filters.page ?? 1,
        per_page: filters.perPage ?? 20,
      },
    });
    const payload = unwrapList(response.data);

    return {
      users: (payload.users ?? []).map(mapSummary),
      page: payload.page ?? filters.page ?? 1,
      perPage: payload.per_page ?? filters.perPage ?? 20,
      total: payload.total ?? payload.users?.length ?? 0,
    };
  }

  /**
   * Loads one user's operational detail.
   *
   * @param userId User UUID.
   * @returns User detail with subscription, entitlements and audit events.
   */
  async getUser(userId: string): Promise<AdminUserDetail> {
    const response = await this.#http.get<AdminUserDetailResponseDto>(`/admin/users/${userId}`);
    return mapDetail(unwrapDetail(response.data));
  }

  /**
   * Grants an entitlement through the admin endpoint.
   *
   * @param input User, feature and audit reason.
   * @returns Audit metadata from the backend.
   */
  async grantEntitlement(
    input: GrantAdminEntitlementInput,
  ): Promise<AdminEntitlementMutationResult> {
    const response = await this.#http.post<AdminEntitlementMutationResponseDto>(
      "/entitlements/admin",
      {
        user_id: input.userId,
        feature_key: input.featureKey,
        reason: input.reason,
      },
    );
    const payload = unwrapMutation(response.data);

    return {
      auditId: payload.audit_id ?? null,
      entitlement: payload.entitlement ? mapEntitlement(payload.entitlement) : undefined,
    };
  }

  /**
   * Revokes an entitlement through the admin endpoint.
   *
   * @param input Entitlement id and audit reason.
   * @returns Audit metadata from the backend.
   */
  async revokeEntitlement(
    input: RevokeAdminEntitlementInput,
  ): Promise<AdminEntitlementMutationResult> {
    const response = await this.#http.delete<AdminEntitlementMutationResponseDto>(
      `/entitlements/admin/${input.entitlementId}`,
      { data: { reason: input.reason } },
    );
    const payload = unwrapMutation(response.data);

    return {
      auditId: payload.audit_id ?? null,
      entitlement: payload.entitlement ? mapEntitlement(payload.entitlement) : undefined,
    };
  }
}

/**
 * Resolves the admin users client with the shared HTTP adapter.
 *
 * @returns AdminUsersClient instance.
 */
export const useAdminUsersClient = (): AdminUsersClient => {
  return new AdminUsersClient(useHttp());
};
