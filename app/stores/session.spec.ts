import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "./session";

interface SessionCookiePayload {
  accessToken: string;
  userEmail: string;
}

const SESSION_COOKIE_KEY = "auraxis_session";

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

/**
 * Reads the auraxis_session cookie from jsdom document.cookie.
 *
 * @returns The decoded payload or null if not present.
 */
const readDocumentCookie = (): SessionCookiePayload | null => {
  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE_KEY}=`));
  if (!entry) { return null; }
  try {
    const raw = entry.split("=").slice(1).join("=");
    return JSON.parse(decodeURIComponent(raw)) as SessionCookiePayload;
  } catch {
    return null;
  }
};

describe("session store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    setDocumentCookie(null);
  });

  describe("signIn", () => {
    it("sets accessToken and userEmail on store state", () => {
      const store = useSessionStore();

      store.signIn("tok-123", "user@auraxis.com");

      expect(store.accessToken).toBe("tok-123");
      expect(store.userEmail).toBe("user@auraxis.com");
    });

    it("marks isAuthenticated as true after sign-in", () => {
      const store = useSessionStore();

      store.signIn("tok-123", "user@auraxis.com");

      expect(store.isAuthenticated).toBe(true);
    });

    it("writes the session cookie to document.cookie", () => {
      const store = useSessionStore();

      store.signIn("tok-abc", "a@b.com");

      const cookie = readDocumentCookie();
      expect(cookie).not.toBeNull();
      expect(cookie?.accessToken).toBe("tok-abc");
      expect(cookie?.userEmail).toBe("a@b.com");
    });

    it("overwrites a previous cookie when called twice", () => {
      const store = useSessionStore();

      store.signIn("tok-first", "first@auraxis.com");
      store.signIn("tok-second", "second@auraxis.com");

      const cookie = readDocumentCookie();
      expect(cookie?.accessToken).toBe("tok-second");
      expect(cookie?.userEmail).toBe("second@auraxis.com");
    });
  });

  describe("signOut", () => {
    it("clears accessToken and userEmail from store state", () => {
      const store = useSessionStore();
      store.signIn("tok-123", "user@auraxis.com");

      store.signOut();

      expect(store.accessToken).toBeNull();
      expect(store.userEmail).toBeNull();
    });

    it("marks isAuthenticated as false after sign-out", () => {
      const store = useSessionStore();
      store.signIn("tok-123", "user@auraxis.com");

      store.signOut();

      expect(store.isAuthenticated).toBe(false);
    });

    it("removes the session cookie from document.cookie", () => {
      const store = useSessionStore();
      store.signIn("tok-123", "user@auraxis.com");

      store.signOut();

      const cookie = readDocumentCookie();
      expect(cookie).toBeNull();
    });
  });

  describe("restore", () => {
    it("restores session from document.cookie", () => {
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

    it("does not authenticate when cookie is absent", () => {
      const store = useSessionStore();
      store.restore();

      expect(store.isAuthenticated).toBe(false);
      expect(store.accessToken).toBeNull();
    });

    it("does not authenticate when cookie value is malformed JSON", () => {
      document.cookie = `${SESSION_COOKIE_KEY}=NOT_VALID_JSON; path=/`;

      const store = useSessionStore();
      store.restore();

      expect(store.isAuthenticated).toBe(false);
      expect(store.accessToken).toBeNull();
    });
  });

  describe("getAccessToken", () => {
    it("returns the access token when store already has one", () => {
      const store = useSessionStore();
      store.signIn("tok-direct", "u@auraxis.com");

      expect(store.getAccessToken()).toBe("tok-direct");
    });

    it("rehydrates token from cookie when store is empty", () => {
      setDocumentCookie({
        accessToken: "cookie-token",
        userEmail: "cookie@auraxis.com",
      });

      const store = useSessionStore();

      expect(store.accessToken).toBeNull();
      expect(store.getAccessToken()).toBe("cookie-token");
      expect(store.userEmail).toBe("cookie@auraxis.com");
    });

    it("returns null when no token exists anywhere", () => {
      const store = useSessionStore();

      expect(store.getAccessToken()).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("is false on initial state", () => {
      const store = useSessionStore();

      expect(store.isAuthenticated).toBe(false);
    });

    it("is true after signIn", () => {
      const store = useSessionStore();
      store.signIn("tok", "u@test.com");

      expect(store.isAuthenticated).toBe(true);
    });

    it("is false after signOut following signIn", () => {
      const store = useSessionStore();
      store.signIn("tok", "u@test.com");
      store.signOut();

      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe("full flow: signIn → F5 → restore", () => {
    it("persists session across store reset (simulated F5)", () => {
      // Step 1: Sign in (writes cookie)
      const store1 = useSessionStore();
      store1.signIn("persistent-token", "persist@auraxis.com");

      // Step 2: Simulate F5 — create a fresh Pinia store (state resets)
      setActivePinia(createPinia());
      const store2 = useSessionStore();

      // Store state is reset
      expect(store2.accessToken).toBeNull();

      // Step 3: restore() reads cookie and re-hydrates
      store2.restore();

      expect(store2.isAuthenticated).toBe(true);
      expect(store2.accessToken).toBe("persistent-token");
      expect(store2.userEmail).toBe("persist@auraxis.com");
    });
  });
});
