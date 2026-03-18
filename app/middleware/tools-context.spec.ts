import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSave = vi.hoisted(() => vi.fn());

vi.mock("~/stores/toolContext", () => ({
  useToolContextStore: (): { save: typeof mockSave } => ({
    save: mockSave,
  }),
}));

vi.mock("#app", () => ({
  defineNuxtRouteMiddleware: (fn: (to: unknown) => unknown): ((to: unknown) => unknown) => fn,
}));

describe("tools-context middleware", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockSave.mockClear();
  });

  it("extrai tool id e result da query e salva no store", async () => {
    const middleware = await import("./tools-context");
    type RouteStub = { query: Record<string, string | undefined> };
    const to: RouteStub = {
      query: {
        tool: "raise-calculator",
        result: encodeURIComponent(JSON.stringify({ score: 42 })),
      },
    };

    (middleware.default as (to: RouteStub) => unknown)(to);

    expect(mockSave).toHaveBeenCalledOnce();
    expect(mockSave).toHaveBeenCalledWith("raise-calculator", { score: 42 });
  });

  it("nao faz nada quando parametro tool nao existe na query", async () => {
    const middleware = await import("./tools-context");
    type RouteStub = { query: Record<string, string | undefined> };
    const to: RouteStub = { query: {} };

    (middleware.default as (to: RouteStub) => unknown)(to);

    expect(mockSave).not.toHaveBeenCalled();
  });
});
