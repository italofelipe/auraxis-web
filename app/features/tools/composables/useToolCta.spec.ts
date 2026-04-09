import { ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useToolCta } from "./useToolCta";

const isAuthenticatedRef = ref(false);

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { isAuthenticated: boolean } => ({
    get isAuthenticated(): boolean {
      return isAuthenticatedRef.value;
    },
  }),
}));

describe("useToolCta", () => {
  beforeEach(() => {
    isAuthenticatedRef.value = false;

  });

  it("showCta is true when the user is not authenticated", () => {
    isAuthenticatedRef.value = false;

    const { showCta } = useToolCta();

    expect(showCta.value).toBe(true);
  });

  it("showCta is false when the user is authenticated", () => {
    isAuthenticatedRef.value = true;
    const { showCta } = useToolCta();

    expect(showCta.value).toBe(false);
  });

  it("showCta reacts to authentication state changes", () => {
    isAuthenticatedRef.value = false;

    const { showCta } = useToolCta();

    expect(showCta.value).toBe(true);

    isAuthenticatedRef.value = true;
    expect(showCta.value).toBe(false);
  });
});
