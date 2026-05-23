import { defineStore } from "pinia";

interface SessionState {
  accessToken: string | null;
  userEmail: string | null;
  emailConfirmed: boolean | null;
  emailConfirmationDeadlineAt: string | null;
  emailConfirmationBlocked: boolean;
  // v3 canonical email_verification block (mirrors /user/me v3 response).
  // Coexists with the legacy fields above during the migration window.
  emailVerified: boolean;
  emailVerificationDeadlineAt: string | null;
  emailVerificationRequiredNow: boolean;
  daysUntilEmailRequired: number | null;
  isRestoringSession: boolean;
  hasTriedSessionRestore: boolean;
}

type SessionRefreshFn = (
  apiBase: string,
  sessionStore: ReturnType<typeof useSessionStore>,
) => Promise<string | null>;

/** Parameters for the signIn action. */
export interface SignInParams {
  /** JWT access token issued after authentication. */
  readonly accessToken: string;
  /** User's email address. */
  readonly userEmail: string;
  /** Whether the user's email has been verified. */
  readonly emailConfirmed?: boolean;
  /** Deadline returned by the backend for mandatory email confirmation. */
  readonly emailConfirmationDeadlineAt?: string | null;
  /** True when the backend has blocked access until confirmation. */
  readonly emailConfirmationBlocked?: boolean;
  /** v3 canonical: whether email_verified_at is set. */
  readonly emailVerified?: boolean;
  /** v3 canonical: ISO datetime of the grace-period deadline. */
  readonly emailVerificationDeadlineAt?: string | null;
  /** v3 canonical: true when grace period has expired without verification. */
  readonly emailVerificationRequiredNow?: boolean;
  /** v3 canonical: countdown in days (can be negative). */
  readonly daysUntilEmailRequired?: number | null;
  /**
   * @deprecated Ignored since SEC-GAP-01. The refresh token is now managed as
   * an httpOnly cookie set server-side by POST /auth/login and
   * POST /auth/refresh — it is never accessible from JavaScript.
   */
  readonly refreshToken?: string | null;
}

/**
 * Shape of the canonical v3 email_verification block returned by /user/me.
 * Used by `hydrateEmailVerification()` to keep the store in sync.
 */
export interface EmailVerificationHydration {
  readonly verified: boolean;
  readonly deadlineAt: string | null;
  readonly requiredNow: boolean;
  readonly daysRemaining: number | null;
}

/**
 * Legacy cookie name written by the pre-SEC-GAP-01 client. Cleared on every
 * sign-in and sign-out to remove the old non-httpOnly token from the browser.
 */
const LEGACY_COOKIE_KEY = "auraxis_session";

/**
 * Removes the legacy auraxis_session cookie that previously stored tokens in
 * a JavaScript-readable non-httpOnly cookie.
 *
 * Guards against SSR/prerender: route middlewares (guest-only, authenticated)
 * call restore() during server-side rendering of prerendered pages where
 * `document` is not defined. The guard makes this a safe no-op in that context.
 */
const clearLegacyCookie = (): void => {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${LEGACY_COOKIE_KEY}=; path=/; SameSite=Lax; Max-Age=0`;
};

let activeSessionRestore: Promise<boolean> | null = null;

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    accessToken: null,
    userEmail: null,
    emailConfirmed: null,
    emailConfirmationDeadlineAt: null,
    emailConfirmationBlocked: false,
    emailVerified: false,
    emailVerificationDeadlineAt: null,
    emailVerificationRequiredNow: false,
    daysUntilEmailRequired: null,
    isRestoringSession: false,
    hasTriedSessionRestore: false,
  }),
  getters: {
    isAuthenticated: (state): boolean => state.accessToken !== null,
  },
  actions: {
    /**
     * No-op since SEC-GAP-01. Session restoration is now handled
     * asynchronously by the session-bootstrap plugin which calls
     * POST /auth/refresh — the httpOnly refresh cookie cannot be read from
     * JavaScript. Kept so existing call sites compile without changes.
     */
    restore(): void {
      clearLegacyCookie();
    },
    async runSessionRestore(apiBase: string, refresh: SessionRefreshFn): Promise<boolean> {
      clearLegacyCookie();

      if (this.isAuthenticated) {
        this.hasTriedSessionRestore = true;
        return true;
      }

      if (activeSessionRestore) {
        return activeSessionRestore;
      }

      this.isRestoringSession = true;
      activeSessionRestore = refresh(apiBase, this)
        .then((token) => Boolean(token) || this.isAuthenticated)
        .finally(() => {
          this.isRestoringSession = false;
          this.hasTriedSessionRestore = true;
          activeSessionRestore = null;
        });

      return activeSessionRestore;
    },
    getAccessToken(): string | null {
      return this.accessToken;
    },
    signIn(params: SignInParams): void {
      this.accessToken = params.accessToken;
      this.userEmail = params.userEmail;
      this.emailConfirmed = params.emailConfirmed ?? null;
      this.emailConfirmationDeadlineAt = params.emailConfirmationDeadlineAt ?? null;
      this.emailConfirmationBlocked = params.emailConfirmationBlocked ?? false;
      this.emailVerified = params.emailVerified ?? params.emailConfirmed ?? false;
      this.emailVerificationDeadlineAt =
        params.emailVerificationDeadlineAt
        ?? params.emailConfirmationDeadlineAt
        ?? null;
      this.emailVerificationRequiredNow =
        params.emailVerificationRequiredNow
        ?? params.emailConfirmationBlocked
        ?? false;
      this.daysUntilEmailRequired = params.daysUntilEmailRequired ?? null;
      // SEC-GAP-01 migration: wipe the old non-httpOnly cookie so tokens are
      // no longer stored in JavaScript-readable browser storage.
      clearLegacyCookie();
    },
    /**
     * Hydrates the email_verification fields from the canonical /user/me v3
     * response block. Called after any successful /user/me fetch (initial
     * bootstrap, periodic refresh, post-confirmation refetch).
     *
     * @param block Canonical v3 email_verification block from /user/me.
     */
    hydrateEmailVerification(block: EmailVerificationHydration): void {
      this.emailVerified = block.verified;
      this.emailVerificationDeadlineAt = block.deadlineAt;
      this.emailVerificationRequiredNow = block.requiredNow;
      this.daysUntilEmailRequired = block.daysRemaining;
      // Keep legacy mirrors in sync for components that still read them.
      this.emailConfirmed = block.verified;
      this.emailConfirmationDeadlineAt = block.deadlineAt;
      this.emailConfirmationBlocked = block.requiredNow;
    },
    /**
     * Updates the in-memory access token after a successful /auth/refresh
     * call. The server rotates the httpOnly refresh cookie; no client action
     * is required for the cookie side.
     *
     * @param accessToken New access token returned by POST /auth/refresh.
     */
    updateTokens(accessToken: string): void {
      this.accessToken = accessToken;
    },
    signOut(): void {
      this.accessToken = null;
      this.userEmail = null;
      this.emailConfirmed = null;
      this.emailConfirmationDeadlineAt = null;
      this.emailConfirmationBlocked = false;
      this.emailVerified = false;
      this.emailVerificationDeadlineAt = null;
      this.emailVerificationRequiredNow = false;
      this.daysUntilEmailRequired = null;
      this.isRestoringSession = false;
      clearLegacyCookie();
    },
  },
});
