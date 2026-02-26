import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useSessionStore } from "./session";

describe("session store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("faz sign-in e sign-out", () => {
    const store = useSessionStore();

    store.signIn("token", "user@auraxis.com");
    expect(store.isAuthenticated).toBe(true);
    expect(store.userEmail).toBe("user@auraxis.com");

    store.signOut();
    expect(store.isAuthenticated).toBe(false);
    expect(store.userEmail).toBeNull();
  });
});
