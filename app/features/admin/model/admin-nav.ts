/**
 * Admin sidebar visibility model (issue #1156).
 *
 * The insights, flags (feature flags + operations summary) and impersonation
 * surfaces call backend endpoints that do not exist in production yet — their
 * nav entries and routes stay behind per-surface release flags until each
 * backend lands on the v2 control plane. Overview and users are always
 * visible: their backend (`/v2/admin/*`) is live.
 */

export const ADMIN_NAV_KEYS = [
  "overview",
  "users",
  "insights",
  "flags",
  "impersonation",
] as const;

export type AdminNavKey = (typeof ADMIN_NAV_KEYS)[number];

export interface AdminSurfaceFlags {
  /** `web.admin.insights` — AI insights listing/detail backend. */
  insights: boolean;
  /** `web.admin.operations` — feature flags + operations summary backend. */
  operations: boolean;
  /** `web.admin.impersonation` — read-only impersonation backend (deferred). */
  impersonation: boolean;
}

/**
 * Returns the nav keys that should render given the per-surface flags.
 *
 * @param flags Per-surface release flag states (see AdminSurfaceFlags).
 * @returns The subset of ADMIN_NAV_KEYS whose surface is enabled.
 */
export function visibleAdminNavKeys(flags: AdminSurfaceFlags): AdminNavKey[] {
  return ADMIN_NAV_KEYS.filter((key) => {
    switch (key) {
      case "insights":
        return flags.insights;
      case "flags":
        return flags.operations;
      case "impersonation":
        return flags.impersonation;
      default:
        return true;
    }
  });
}
