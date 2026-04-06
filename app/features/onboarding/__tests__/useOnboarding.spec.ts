import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { UserProfileDto } from "~/features/profile/contracts/user-profile.dto";
import { useOnboarding } from "../composables/useOnboarding";
import { useUserStore } from "~/stores/user";
import { useSessionStore } from "~/stores/session";

// Mock localStorage with an in-memory store
let _store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string): string | null => _store[key] ?? null),
  setItem: vi.fn((key: string, value: string): void => { _store[key] = value; }),
  removeItem: vi.fn((key: string): void => { Reflect.deleteProperty(_store, key); }),
  clear: vi.fn((): void => { _store = {}; }),
};

// Mock onMounted to run immediately so localStorage is read during test setup
vi.mock("vue", async () => {
  const actual = await vi.importActual("vue") as object;
  return {
    ...actual,
    onMounted: (fn: () => void): void => { fn(); },
  };
});

describe("useOnboarding", () => {
  beforeEach((): void => {
    setActivePinia(createPinia());
    Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  it("shouldShow is false when user is not loaded", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    userStore.$patch({ isLoaded: false });
    sessionStore.$patch({ emailConfirmed: true });

    const { shouldShow } = useOnboarding();
    expect(shouldShow.value).toBe(false);
  });

  it("shouldShow is false when email is not confirmed", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    userStore.$patch({ isLoaded: true, profile: null });
    sessionStore.$patch({ emailConfirmed: false });

    const { shouldShow } = useOnboarding();
    expect(shouldShow.value).toBe(false);
  });

  it("shouldShow is false when profile is already complete", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true });
    userStore.$patch({
      isLoaded: true,
      profile: {
        id: "u1",
        name: "Test",
        email: "test@test.com",
        gender: "M",
        birth_date: "1990-01-01",
        monthly_income: 5000,
        monthly_income_net: null,
        net_worth: 10000,
        monthly_expenses: 2000,
        initial_investment: null,
        monthly_investment: null,
        investment_goal_date: null,
        state_uf: "SP",
        occupation: "Engineer",
        investor_profile: "moderate",
        financial_objectives: "savings",
        investor_profile_suggested: null,
        profile_quiz_score: null,
        taxonomy_version: null,
      } as UserProfileDto,
    });

    const { shouldShow } = useOnboarding();
    expect(shouldShow.value).toBe(false);
  });

  it("shouldShow is true when email confirmed, profile incomplete, and not seen", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { shouldShow } = useOnboarding();
    expect(shouldShow.value).toBe(true);
  });

  it("shouldShow becomes false after skip()", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { shouldShow, skip } = useOnboarding();
    expect(shouldShow.value).toBe(true);
    skip();
    expect(shouldShow.value).toBe(false);
  });

  it("shouldShow becomes false after complete()", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { shouldShow, complete } = useOnboarding();
    expect(shouldShow.value).toBe(true);
    complete();
    expect(shouldShow.value).toBe(false);
  });

  it("persists skip to localStorage", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { skip } = useOnboarding();
    skip();

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const key = localStorageMock.setItem.mock.calls[0]![0] as string;
    const value = JSON.parse(localStorageMock.setItem.mock.calls[0]![1] as string) as { done: boolean; skipped: boolean };
    expect(key).toContain("auraxis:onboarding:");
    expect(value).toEqual({ done: false, skipped: true });
  });

  it("persists complete to localStorage", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { complete } = useOnboarding();
    complete();

    const value = JSON.parse(localStorageMock.setItem.mock.calls[0]![1] as string) as { done: boolean; skipped: boolean };
    expect(value).toEqual({ done: true, skipped: false });
  });

  it("reset() restores shouldShow", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { shouldShow, skip, reset } = useOnboarding();
    skip();
    expect(shouldShow.value).toBe(false);
    reset();
    expect(shouldShow.value).toBe(true);
  });

  it("reads persisted state from localStorage on mount", () => {
    const sessionStore = useSessionStore();
    const userStore = useUserStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    // Pre-seed localStorage with skipped state
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ done: false, skipped: true }));

    const { shouldShow } = useOnboarding();
    expect(shouldShow.value).toBe(false);
  });
});
