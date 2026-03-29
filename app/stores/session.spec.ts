import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "./session";

interface SessionCookiePayload {
  accessToken: string;
  userEmail: string;
}

const SESSION_COOKIE_KEY = "auraxis_session";

// useCookie mock is still needed for signIn / signOut (they write back via useCookie).
const sessionCookieState = vi.hoisted(() => ({
  value: null as SessionCookiePayload | null,
}));

vi.mock("#app", () => ({
  useCookie: (): {
    value: SessionCookiePayload | null;
  } => ({
    get value(): SessionCookiePayload | null {
      return sessionCookieState.value;
    },
    set value(nextValue: SessionCookiePayload | null) {
      sessionCookieState.value = nextValue;
    },
  }),
}));

/**
 * Sets the auraxis_session cookie in jsdom so that restore() can read it.
 *
 * @param payload Cookie payload or null to clear.
 */
const setDocumentCookie = (payload: SessionCookiePayload | null): void => {
  // Clear any existing cookie first.
  document.cookie = `${SESSION_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  if (payload !== null) {
    const encoded = encodeURIComponent(JSON.stringify(payload));
    document.cookie = `${SESSION_COOKIE_KEY}=${encoded}; path=/`;
  }
};

describe("session store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionCookieState.value = null;
    setDocumentCookie(null);
  });

  it("faz sign-in e sign-out", () => {
    const store = useSessionStore();

    store.signIn("token", "user@auraxis.com");
    expect(store.isAuthenticated).toBe(true);
    expect(store.userEmail).toBe("user@auraxis.com");
    expect(sessionCookieState.value).toEqual({
      accessToken: "token",
      userEmail: "user@auraxis.com",
    });

    store.signOut();
    expect(store.isAuthenticated).toBe(false);
    expect(store.userEmail).toBeNull();
    expect(sessionCookieState.value).toBeNull();
  });

  it("restaura sessao a partir do document.cookie", () => {
    setDocumentCookie({
      accessToken: "cookie-token",
      userEmail: "cookie@auraxis.com",
    });

    const store = useSessionStore();
    store.restore();

    expect(store.isAuthenticated).toBe(true);
    expect(store.accessToken).toBe("cookie-token");
    expect(store.userEmail).toBe("cookie@auraxis.com");
  });

  it("nao autentica quando o cookie esta vazio", () => {
    const store = useSessionStore();
    store.restore();

    expect(store.isAuthenticated).toBe(false);
  });

  it("reidrata o token quando getAccessToken e chamado com store vazio", () => {
    setDocumentCookie({
      accessToken: "cookie-token",
      userEmail: "cookie@auraxis.com",
    });

    const store = useSessionStore();

    expect(store.accessToken).toBeNull();
    expect(store.getAccessToken()).toBe("cookie-token");
    expect(store.userEmail).toBe("cookie@auraxis.com");
  });
});
