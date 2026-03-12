import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSessionStore } from "./session";

interface SessionCookiePayload {
  accessToken: string;
  userEmail: string;
}

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

describe("session store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionCookieState.value = null;
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

  it("restaura sessao a partir do cookie", () => {
    sessionCookieState.value = {
      accessToken: "cookie-token",
      userEmail: "cookie@auraxis.com",
    };

    const store = useSessionStore();
    store.restore();

    expect(store.isAuthenticated).toBe(true);
    expect(store.accessToken).toBe("cookie-token");
    expect(store.userEmail).toBe("cookie@auraxis.com");
  });

  it("reidrata o token quando getAccessToken e chamado com store vazio", () => {
    sessionCookieState.value = {
      accessToken: "cookie-token",
      userEmail: "cookie@auraxis.com",
    };

    const store = useSessionStore();

    expect(store.accessToken).toBeNull();
    expect(store.getAccessToken()).toBe("cookie-token");
    expect(store.userEmail).toBe("cookie@auraxis.com");
  });
});
