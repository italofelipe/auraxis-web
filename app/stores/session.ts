import { useCookie } from "#app";
import { defineStore } from "pinia";
import type { Ref } from "vue";

interface SessionCookiePayload {
  accessToken: string;
  userEmail: string;
}

interface SessionState {
  accessToken: string | null;
  userEmail: string | null;
}

const SESSION_COOKIE_KEY = "auraxis_session";

/**
 * Resolves the canonical authenticated session cookie.
 * @returns Reactive reference to the session cookie.
 */
const useSessionCookie = (): Ref<SessionCookiePayload | null> => {
  return useCookie<SessionCookiePayload | null>(SESSION_COOKIE_KEY, {
    default: () => null,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    watch: false,
  }) as Ref<SessionCookiePayload | null>;
};

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
      const sessionCookie = useSessionCookie();

      applyCookiePayloadToState(this, sessionCookie.value);
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

      const sessionCookie = useSessionCookie();
      sessionCookie.value = {
        accessToken,
        userEmail,
      };
    },
    signOut(): void {
      applyCookiePayloadToState(this, null);

      const sessionCookie = useSessionCookie();
      sessionCookie.value = null;
    },
  },
});
