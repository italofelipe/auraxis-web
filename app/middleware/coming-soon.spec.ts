import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIsFeatureEnabled = vi.hoisted(() => vi.fn((_key: string): boolean => false));
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));

vi.mock("~/shared/feature-flags", () => ({
  isFeatureEnabled: mockIsFeatureEnabled,
}));

vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  defineNuxtRouteMiddleware: (fn: (to: { path: string }) => unknown): ((to: { path: string }) => unknown) => fn,
}));

describe("coming-soon middleware", () => {
  beforeEach(() => {
    mockIsFeatureEnabled.mockClear();
    mockNavigateTo.mockClear();
  });

  it("redirects to /coming-soon when route flag is disabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const middleware = await import("./coming-soon");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/portfolio" });
    expect(mockNavigateTo).toHaveBeenCalledWith("/coming-soon");
    expect(result).toBe("/coming-soon");
  });

  it("does not redirect when route flag is enabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const middleware = await import("./coming-soon");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/portfolio" });
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("does not redirect for routes not in the flag map", async () => {
    const middleware = await import("./coming-soon");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/dashboard" });
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it("redirects /goals when flag is disabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    const middleware = await import("./coming-soon");
    (middleware.default as (to: { path: string }) => unknown)({ path: "/goals" });
    expect(mockNavigateTo).toHaveBeenCalledWith("/coming-soon");
  });

  it("allows /settings/accounts through when flag is enabled", async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const middleware = await import("./coming-soon");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/settings/accounts" });
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
