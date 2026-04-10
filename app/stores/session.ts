import { defineStore } from "pinia";

interface SessionState {
  accessToken: string | null;
  userEmail: string | null;
  emailConfirmed: boolean | null;
}

/** Parameters for the signIn action. */
export interface SignInParams {
  /** JWT access token issued after authentication. */
  readonly accessToken: string;
  /** User's email address. */
  readonly userEmail: string;
  /** Whether the user's email has been verified. */
  readonly emailConfirmed?: boolean;
  /**
   * @deprecated Ignored since SEC-GAP-01. The refresh token is now managed as
   * an httpOnly cookie set server-side by POST /auth/login and
   * POST /auth/refresh — it is never accessible from JavaScript.
   */
  readonly refreshToken?: string | null;
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
 * All callers (signIn, signOut, restore) are invoked only in client context —
 * the session-restore plugin guards against SSR via `import.meta.client`, and
 * Pinia actions are always called from Vue components or composables. No SSR
 * guard is needed here.
 */
const clearLegacyCookie = (): void => {
  document.cookie = `${LEGACY_COOKIE_KEY}=; path=/; SameSite=Lax; Max-Age=0`;
};

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    accessToken: null,
    userEmail: null,
    emailConfirmed: null,
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
    getAccessToken(): string | null {
      return this.accessToken;
    },
    signIn(params: SignInParams): void {
      this.accessToken = params.accessToken;
      this.userEmail = params.userEmail;
      this.emailConfirmed = params.emailConfirmed ?? null;
      // SEC-GAP-01 migration: wipe the old non-httpOnly cookie so tokens are
      // no longer stored in JavaScript-readable browser storage.
      clearLegacyCookie();
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
      clearLegacyCookie();
    },
  },
});
