import { defineStore } from "pinia";

interface SessionCookiePayload {
  accessToken: string;
  refreshToken: string | null;
  userEmail: string;
  emailConfirmed?: boolean;
}

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  userEmail: string | null;
  emailConfirmed: boolean | null;
}

/** Parameters for the signIn action. */
export interface SignInParams {
  /** JWT access token issued after authentication. */
  readonly accessToken: string;
  /** Opaque refresh token, or null when the server does not issue one. */
  readonly refreshToken: string | null;
  /** User's email address. */
  readonly userEmail: string;
  /** Whether the user's email has been verified. */
  readonly emailConfirmed?: boolean;
}

const SESSION_COOKIE_KEY = "auraxis_session";
const SESSION_COOKIE_MAX_AGE = 604800; // 7 days in seconds

/**
 * Applies the persisted cookie payload to the local store state.
 * @param state Mutable session state.
 * @param payload Persisted payload or null when there is no session.
 */
const applyCookiePayloadToState = (
  state: SessionState,
  payload: SessionCookiePayload | null,
): void => {
  state.accessToken = payload?.accessToken ?? null;
  state.refreshToken = payload?.refreshToken ?? null;
  state.userEmail = payload?.userEmail ?? null;
  state.emailConfirmed = payload?.emailConfirmed ?? null;
};

/**
 * Builds the cookie string and writes it to document.cookie.
 * @param payload Cookie payload to persist.
 */
const writeCookie = (payload: SessionCookiePayload): void => {
  if (typeof document === "undefined") {
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(payload))}; path=/; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE}${secure}`;
};

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    accessToken: null,
    refreshToken: null,
    userEmail: null,
    emailConfirmed: null,
  }),
  getters: {
    isAuthenticated: (state): boolean => state.accessToken !== null,
  },
  actions: {
    restore(): void {
      // useCookie() requires an active Nuxt app context and is unreliable
      // when called from inside a Pinia action (e.g. from a plugin or middleware).
      // For all private routes (ssr: false) the browser's document.cookie is
      // always available on the client, so we parse it directly.
      if (typeof document === "undefined") {
        return;
      }

      const entry = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${SESSION_COOKIE_KEY}=`));

      if (!entry) {
        applyCookiePayloadToState(this, null);
        return;
      }

      try {
        const raw = entry.split("=").slice(1).join("=");
        const payload = JSON.parse(decodeURIComponent(raw)) as SessionCookiePayload;
        applyCookiePayloadToState(this, payload);
      } catch {
        applyCookiePayloadToState(this, null);
      }
    },
    getAccessToken(): string | null {
      if (this.accessToken) {
        return this.accessToken;
      }

      this.restore();
      return this.accessToken;
    },
    getRefreshToken(): string | null {
      if (this.refreshToken) {
        return this.refreshToken;
      }

      this.restore();
      return this.refreshToken;
    },
    signIn(params: SignInParams): void {
      this.accessToken = params.accessToken;
      this.refreshToken = params.refreshToken;
      this.userEmail = params.userEmail;
      this.emailConfirmed = params.emailConfirmed ?? null;

      writeCookie({
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        userEmail: params.userEmail,
        emailConfirmed: params.emailConfirmed,
      });
    },
    /**
     * Updates stored tokens after a successful token refresh, without altering
     * the user identity fields. The cookie is rewritten with the new token pair.
     * @param accessToken New access token.
     * @param refreshToken New refresh token.
     */
    updateTokens(accessToken: string, refreshToken: string): void {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;

      writeCookie({
        accessToken,
        refreshToken,
        userEmail: this.userEmail ?? "",
        emailConfirmed: this.emailConfirmed ?? undefined,
      });
    },
    signOut(): void {
      applyCookiePayloadToState(this, null);

      // Clear cookie directly via document.cookie for the same reason as signIn.
      if (typeof document === "undefined") {
        return;
      }

      document.cookie = `${SESSION_COOKIE_KEY}=; path=/; SameSite=Lax; Max-Age=0`;
    },
  },
});
