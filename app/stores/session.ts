import { defineStore } from "pinia";

interface SessionCookiePayload {
  accessToken: string;
  userEmail: string;
}

interface SessionState {
  accessToken: string | null;
  userEmail: string | null;
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
  state.userEmail = payload?.userEmail ?? null;
};

export const useSessionStore = defineStore("session", {
  state: (): SessionState => ({
    accessToken: null,
    userEmail: null,
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
    signIn(accessToken: string, userEmail: string): void {
      this.accessToken = accessToken;
      this.userEmail = userEmail;

      // Write cookie directly via document.cookie to avoid calling useCookie()
      // outside a Nuxt app context. signIn is invoked from Vue Query mutation
      // onSuccess callbacks which run outside the Nuxt composable context.
      if (typeof document === "undefined") {
        return;
      }

      const isProduction = process.env.NODE_ENV === "production";
      const secure = isProduction ? "; Secure" : "";
      document.cookie = `${SESSION_COOKIE_KEY}=${encodeURIComponent(JSON.stringify({ accessToken, userEmail }))}; path=/; SameSite=Lax; Max-Age=${SESSION_COOKIE_MAX_AGE}${secure}`;
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
