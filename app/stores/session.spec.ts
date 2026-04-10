/**
 * SEC-GAP-01 — split-token session store tests.
 *
 * The refresh token is now managed as a server-set httpOnly cookie and is
 * never stored in Pinia state or in any JavaScript-readable browser storage.
 * The session store only holds the access token and non-sensitive user
 * metadata (email, emailConfirmed).
 */
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "./session";

const LEGACY_COOKIE_KEY = "auraxis_session";

/**
 * Reads the legacy auraxis_session cookie value from the jsdom/happy-dom
 * cookie jar. Returns null when the cookie is absent OR when the value is
 * empty (happy-dom represents a Max-Age=0 cleared cookie as "" instead of
 * removing the entry entirely).
 *
 * @returns Cookie value string, or null when absent or cleared.
 */
const readLegacyCookie = (): string | null => {
  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LEGACY_COOKIE_KEY}=`));
  if (!entry) {
    return null;
  }
  const value = entry.split("=").slice(1).join("=");
  return value === "" ? null : value;
};

/**
 * Writes the legacy auraxis_session cookie in jsdom to simulate the old format.
 *
 * @param value Cookie value to write.
 */
const writeLegacyCookie = (value: string): void => {
  document.cookie = `${LEGACY_COOKIE_KEY}=${value}; path=/`;
};

describe("session store (split-token, SEC-GAP-01)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Start each test with a clean cookie jar.
    document.cookie = `${LEGACY_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  afterEach(() => {
    document.cookie = `${LEGACY_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  // ─── signIn ───────────────────────────────────────────────────────────────

  describe("signIn", () => {
    it("sets accessToken, userEmail and emailConfirmed in state", () => {
      const store = useSessionStore();

      store.signIn({
        accessToken: "tok-123",
        userEmail: "user@auraxis.com",
        emailConfirmed: true,
      });

      expect(store.accessToken).toBe("tok-123");
      expect(store.userEmail).toBe("user@auraxis.com");
      expect(store.emailConfirmed).toBe(true);
    });

    it("marks isAuthenticated as true after sign-in", () => {
      const store = useSessionStore();

      store.signIn({ accessToken: "tok-123", userEmail: "u@auraxis.com" });

      expect(store.isAuthenticated).toBe(true);
    });

    it("does NOT store anything in document.cookie", () => {
      const store = useSessionStore();

      store.signIn({ accessToken: "tok-abc", userEmail: "a@b.com" });

      // The legacy cookie must not have been re-created.
      expect(readLegacyCookie()).toBeNull();
    });

    it("clears the legacy auraxis_session cookie if present", () => {
      writeLegacyCookie("stale-payload");
      const store = useSessionStore();

      store.signIn({ accessToken: "tok-abc", userEmail: "a@b.com" });

      expect(readLegacyCookie()).toBeNull();
    });

    it("ignores the deprecated refreshToken param without error", () => {
      const store = useSessionStore();

      // Callers that still pass refreshToken during the dual-mode window
      // must not cause a TS or runtime error.
      store.signIn({
        accessToken: "tok",
        userEmail: "u@auraxis.com",
        refreshToken: "some-token",
      });

      expect(store.isAuthenticated).toBe(true);
    });
  });

  // ─── signOut ──────────────────────────────────────────────────────────────

  describe("signOut", () => {
    it("clears accessToken, userEmail and emailConfirmed from state", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "tok-123", userEmail: "user@auraxis.com" });

      store.signOut();

      expect(store.accessToken).toBeNull();
      expect(store.userEmail).toBeNull();
      expect(store.emailConfirmed).toBeNull();
    });

    it("marks isAuthenticated as false after sign-out", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "tok-123", userEmail: "u@auraxis.com" });

      store.signOut();

      expect(store.isAuthenticated).toBe(false);
    });

    it("clears the legacy auraxis_session cookie on sign-out", () => {
      writeLegacyCookie("stale-payload");
      const store = useSessionStore();

      store.signOut();

      expect(readLegacyCookie()).toBeNull();
    });
  });

  // ─── restore ──────────────────────────────────────────────────────────────

  describe("restore", () => {
    it("is a no-op: does not set accessToken from any cookie", () => {
      writeLegacyCookie(
        encodeURIComponent(
          JSON.stringify({
            accessToken: "old-at",
            refreshToken: "old-rt",
            userEmail: "old@auraxis.com",
          }),
        ),
      );

      const store = useSessionStore();
      store.restore();

      // Access token must NOT be restored from the old cookie (SEC-GAP-01).
      expect(store.isAuthenticated).toBe(false);
      expect(store.accessToken).toBeNull();
    });

    it("clears the legacy auraxis_session cookie when called", () => {
      writeLegacyCookie("stale-payload");
      const store = useSessionStore();

      store.restore();

      expect(readLegacyCookie()).toBeNull();
    });
  });

  // ─── getAccessToken ───────────────────────────────────────────────────────

  describe("getAccessToken", () => {
    it("returns the access token when store has one", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "tok-direct", userEmail: "u@auraxis.com" });

      expect(store.getAccessToken()).toBe("tok-direct");
    });

    it("returns null when no token is in state", () => {
      const store = useSessionStore();

      expect(store.getAccessToken()).toBeNull();
    });

    it("does NOT attempt to read from document.cookie", () => {
      writeLegacyCookie(
        encodeURIComponent(
          JSON.stringify({ accessToken: "cookie-tok", userEmail: "x@y.com" }),
        ),
      );
      const store = useSessionStore();

      // Should return null even though the legacy cookie has a token.
      expect(store.getAccessToken()).toBeNull();
    });
  });

  // ─── updateTokens ─────────────────────────────────────────────────────────

  describe("updateTokens", () => {
    it("updates access token in state without touching userEmail", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "old-at", userEmail: "u@auraxis.com" });

      store.updateTokens("new-at");

      expect(store.accessToken).toBe("new-at");
      expect(store.userEmail).toBe("u@auraxis.com");
    });

    it("does NOT write to document.cookie", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "old-at", userEmail: "u@auraxis.com" });

      store.updateTokens("new-at");

      expect(readLegacyCookie()).toBeNull();
    });
  });

  // ─── isAuthenticated ──────────────────────────────────────────────────────

  describe("isAuthenticated", () => {
    it("is false on initial state", () => {
      expect(useSessionStore().isAuthenticated).toBe(false);
    });

    it("is true after signIn", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "tok", userEmail: "u@test.com" });

      expect(store.isAuthenticated).toBe(true);
    });

    it("is false after signOut following signIn", () => {
      const store = useSessionStore();
      store.signIn({ accessToken: "tok", userEmail: "u@test.com" });
      store.signOut();

      expect(store.isAuthenticated).toBe(false);
    });
  });

  // ─── SSR safety ───────────────────────────────────────────────────────────

  describe("SSR safety (clearLegacyCookie when document is undefined)", () => {
    it("does not throw when document is undefined (route middleware runs during prerender)", () => {
      const store = useSessionStore();
      const savedDocument = globalThis.document;
      // Simulate SSR prerender environment where document is not available.
      // Route middlewares (guest-only, authenticated) call restore() server-side;
      // clearLegacyCookie must be a safe no-op in that context.
      // @ts-expect-error — intentionally removing document to test SSR guard
      globalThis.document = undefined;
      try {
        expect(() => store.restore()).not.toThrow();
        expect(() => store.signOut()).not.toThrow();
        expect(() =>
          store.signIn({ accessToken: "tok", userEmail: "u@test.com" }),
        ).not.toThrow();
      } finally {
        globalThis.document = savedDocument;
      }
    });
  });

  // ─── F5 / page reload simulation ──────────────────────────────────────────

  describe("page reload behavior", () => {
    it("is not authenticated after Pinia reset (session must be re-bootstrapped via /auth/refresh)", () => {
      // Step 1: Sign in (stores access token in memory)
      const store1 = useSessionStore();
      store1.signIn({ accessToken: "persistent-token", userEmail: "user@auraxis.com" });

      // Step 2: Simulate page reload — Pinia state is lost
      setActivePinia(createPinia());
      const store2 = useSessionStore();

      // State is gone; restore() does not re-hydrate from cookie anymore.
      // The plugin calls /auth/refresh to re-bootstrap via httpOnly cookie.
      store2.restore();

      expect(store2.isAuthenticated).toBe(false);
      // (The session-restore plugin would then call POST /auth/refresh and,
      // on success, call store2.updateTokens("new-access-token").)
    });
  });
});
