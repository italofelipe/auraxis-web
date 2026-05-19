import type { Ref } from "vue";

import type { AdminImpersonationSession } from "~/features/admin/impersonation/model/admin-impersonation";

export const ADMIN_IMPERSONATION_STORAGE_KEY = "auraxis:admin-impersonation-readonly:v1";

/**
 * Parses the persisted read-only impersonation session.
 *
 * @param raw Serialized session payload from browser storage.
 * @returns Active session data, or null when absent, expired or malformed.
 */
const parseSession = (raw: string | null): AdminImpersonationSession | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminImpersonationSession>;

    if (!parsed.sessionId || !parsed.userId || !parsed.userEmail || !parsed.expiresAt) {
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      removeStoredSession();
      return null;
    }

    return {
      sessionId: parsed.sessionId,
      auditId: parsed.auditId ?? null,
      userId: parsed.userId,
      userName: parsed.userName ?? "Usuário",
      userEmail: parsed.userEmail,
      startedAt: parsed.startedAt ?? new Date().toISOString(),
      expiresAt: parsed.expiresAt,
      readOnly: true,
    };
  } catch {
    removeStoredSession();
    return null;
  }
};

/**
 * Reads the persisted session payload only in the browser.
 *
 * @returns Serialized session payload, or null outside the client/runtime storage.
 */
const getStoredSession = (): string | null => {
  if (!import.meta.client) {
    return null;
  }

  try {
    return globalThis.localStorage.getItem(ADMIN_IMPERSONATION_STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Persists a read-only impersonation session in browser storage.
 *
 * @param session Session returned by the admin API.
 * @returns Nothing.
 */
const setStoredSession = (session: AdminImpersonationSession): void => {
  if (!import.meta.client) {
    return;
  }

  globalThis.localStorage.setItem(ADMIN_IMPERSONATION_STORAGE_KEY, JSON.stringify(session));
};

/**
 * Clears the persisted read-only impersonation session.
 *
 * @returns Nothing.
 */
const removeStoredSession = (): void => {
  if (!import.meta.client) {
    return;
  }

  globalThis.localStorage.removeItem(ADMIN_IMPERSONATION_STORAGE_KEY);
};

/**
 * Reads the current read-only impersonation session.
 *
 * @returns Active session data, or null when no session is active.
 */
export const readAdminImpersonationSession = (): AdminImpersonationSession | null => {
  return parseSession(getStoredSession());
};

/**
 * Checks whether admin read-only impersonation is active.
 *
 * @returns True when a non-expired read-only impersonation session exists.
 */
export const isAdminImpersonationReadOnlyActive = (): boolean =>
  readAdminImpersonationSession() !== null;

export interface AdminImpersonationSessionState {
  readonly session: Ref<AdminImpersonationSession | null>;
  readonly isActive: Ref<boolean>;
  readonly startLocalSession: (session: AdminImpersonationSession) => void;
  readonly clearLocalSession: () => void;
}

/**
 * Provides shared state and mutators for read-only impersonation.
 *
 * @returns Reactive impersonation session state.
 */
export const useAdminImpersonationSession = (): AdminImpersonationSessionState => {
  const session = useState<AdminImpersonationSession | null>(
    "admin-impersonation-session",
    () => readAdminImpersonationSession(),
  );
  const isActive = computed(() => session.value !== null);

  /**
   * Stores a newly created read-only impersonation session.
   *
   * @param nextSession Session returned by the admin API.
   * @returns Nothing.
   */
  const startLocalSession = (nextSession: AdminImpersonationSession): void => {
    session.value = nextSession;
    setStoredSession(nextSession);
  };

  /**
   * Ends the local read-only impersonation session.
   *
   * @returns Nothing.
   */
  const clearLocalSession = (): void => {
    session.value = null;
    removeStoredSession();
  };

  return {
    session,
    isActive,
    startLocalSession,
    clearLocalSession,
  };
};
