import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { UserProfileDto } from "~/features/profile/contracts/user-profile.dto";
import { useOnboarding } from "../composables/useOnboarding";
import { useUserStore } from "~/stores/user";
import { useSessionStore } from "~/stores/session";

let _store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string): string | null => _store[key] ?? null),
  setItem: vi.fn((key: string, value: string): void => { _store[key] = value; }),
  removeItem: vi.fn((key: string): void => { Reflect.deleteProperty(_store, key); }),
  clear: vi.fn((): void => { _store = {}; }),
};

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
    // Reset module-level singleton state between tests.
    const { reset } = useOnboarding();
    reset();
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

  it("shouldShow is true when email confirmed and tour not yet seen", () => {
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

  it("start() forces shouldShow to true even after skip()", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { shouldShow, skip, start } = useOnboarding();
    skip();
    expect(shouldShow.value).toBe(false);
    start();
    expect(shouldShow.value).toBe(true);
  });

  it("start() re-opens the tour after complete()", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { shouldShow, complete, start } = useOnboarding();
    complete();
    expect(shouldShow.value).toBe(false);
    start();
    expect(shouldShow.value).toBe(true);
  });

  it("persists skip to localStorage", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { skip } = useOnboarding();
    skip();

    expect(localStorageMock.setItem).toHaveBeenCalled();
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]!;
    const key = lastCall[0] as string;
    const value = JSON.parse(lastCall[1] as string) as { done: boolean; skipped: boolean };
    expect(key).toContain("auraxis:onboarding:");
    expect(value).toMatchObject({ done: false, skipped: true });
  });

  it("persists complete to localStorage", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { complete } = useOnboarding();
    complete();

    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]!;
    const value = JSON.parse(lastCall[1] as string) as { done: boolean; skipped: boolean };
    expect(value).toMatchObject({ done: true, skipped: false });
  });

  it("persists currentStep across setCurrentStep calls", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { setCurrentStep, currentStep } = useOnboarding();
    setCurrentStep(3);
    expect(currentStep.value).toBe(3);

    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]!;
    const value = JSON.parse(lastCall[1] as string) as { currentStep: number };
    expect(value.currentStep).toBe(3);
  });

  it("persists setStepData and roundtrips via getStepData", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const { setStepData, getStepData } = useOnboarding();
    setStepData("step2", { title: "Salário", amount: "5000", type: "income", dueDate: "2026-05-05" });

    expect(getStepData("step2")).toEqual({
      title: "Salário",
      amount: "5000",
      type: "income",
      dueDate: "2026-05-05",
    });
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]!;
    const value = JSON.parse(lastCall[1] as string) as { formData: { step2: { title: string } } };
    expect(value.formData.step2.title).toBe("Salário");
  });

  // reason: these are composable API calls (skip/complete), not vitest test skips.
  it("isSkipped reflects skip() and isDone reflects complete()", () => {
    const userStore = useUserStore();
    const sessionStore = useSessionStore();
    sessionStore.$patch({ emailConfirmed: true, userEmail: "user@test.com" });
    userStore.$patch({ isLoaded: true, profile: { id: "u1", name: "Test", email: "user@test.com" } as unknown as UserProfileDto });

    const onboarding = useOnboarding();
    expect(onboarding.isSkipped.value).toBe(false);
    expect(onboarding.isDone.value).toBe(false);

    onboarding.skip();
    expect(onboarding.isSkipped.value).toBe(true);
    expect(onboarding.isDone.value).toBe(false);

    onboarding.reset();
    onboarding.complete();
    expect(onboarding.isDone.value).toBe(true);
    expect(onboarding.isSkipped.value).toBe(false);
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
});
