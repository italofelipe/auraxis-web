import { computed, type ComputedRef } from "vue";
import { useSessionStore } from "~/stores/session";

interface JwtAdminPayload {
  readonly role?: unknown;
  readonly roles?: unknown;
  readonly permissions?: unknown;
  readonly is_admin?: unknown;
  readonly isAdmin?: unknown;
}

export interface AdminAccessClaims {
  readonly isAdmin: boolean;
  readonly roles: string[];
  readonly permissions: string[];
}

export interface AdminAccessState {
  readonly claims: ComputedRef<AdminAccessClaims>;
  readonly isAdmin: ComputedRef<boolean>;
}

const ADMIN_ROLES = new Set([
  "admin",
  "platform_admin",
  "super_admin",
  "owner",
]);

const ADMIN_PERMISSIONS = new Set([
  "*",
  "admin:*",
  "admin:access",
]);

const EMPTY_ACCESS: AdminAccessClaims = {
  isAdmin: false,
  roles: [],
  permissions: [],
};

/**
 * Normalizes string or string-array claims into a plain string list.
 *
 * @param value Raw claim value.
 * @returns Normalized list of strings.
 */
const normalizeList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return typeof value === "string" && value.trim().length > 0 ? [value] : [];
};

/**
 * Decodes the JWT base64url payload segment in browser and test runtimes.
 *
 * @param value Encoded JWT payload segment.
 * @returns Decoded JSON string.
 */
const decodeBase64Url = (value: string): string => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf8");
};

/**
 * Parses a JWT payload safely, returning null for malformed tokens.
 *
 * @param token JWT access token.
 * @returns Parsed payload or null.
 */
const parseJwtPayload = (token: string | null): JwtAdminPayload | null => {
  if (!token) {
    return null;
  }

  const [, encodedPayload] = token.split(".");
  if (!encodedPayload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(encodedPayload)) as JwtAdminPayload;
  } catch {
    return null;
  }
};

/**
 * Resolves whether a session token carries admin-level authorization.
 *
 * The API v2 RBAC contract is still evolving, so this accepts the claim shapes
 * documented in the admin backlog: boolean admin flags, a single role,
 * role arrays, and permission arrays.
 *
 * @param token JWT access token currently held in memory.
 * @returns Normalized admin access claims.
 */
export const getAdminAccessFromToken = (token: string | null): AdminAccessClaims => {
  const payload = parseJwtPayload(token);

  if (!payload) {
    return EMPTY_ACCESS;
  }

  const roles = [...normalizeList(payload.role), ...normalizeList(payload.roles)];
  const permissions = normalizeList(payload.permissions);
  const hasRole = roles.some((role) => ADMIN_ROLES.has(role));
  const hasPermission = permissions.some((permission) => ADMIN_PERMISSIONS.has(permission));
  const hasBooleanFlag = payload.is_admin === true || payload.isAdmin === true;

  return {
    isAdmin: hasBooleanFlag || hasRole || hasPermission,
    roles,
    permissions,
  };
};

/**
 * Reactive admin access state derived from the in-memory session token.
 *
 * @returns Computed claims and admin boolean for components/layouts.
 */
export const useAdminAccess = (): AdminAccessState => {
  const sessionStore = useSessionStore();
  const claims = computed(() => getAdminAccessFromToken(sessionStore.accessToken));

  return {
    claims,
    isAdmin: computed(() => claims.value.isAdmin),
  };
};
