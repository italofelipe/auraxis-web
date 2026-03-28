import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApiQuery } from "../use-api-query";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a resolved fetcher returning the provided value.
 *
 * @param value Value to resolve.
 * @returns Async fetcher function.
 */
const makeFetcher = <T>(value: T): (() => Promise<T>) =>
  (): Promise<T> => Promise.resolve(value);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createApiQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);
  });

  it("passa queryKey para useQuery", () => {
    const key = ["goals", "list"] as const;
    const result = createApiQuery(key, makeFetcher([])) as unknown as {
      queryKey: typeof key;
    };

    expect(result.queryKey).toEqual(["goals", "list"]);
  });

  it("passa fetcher como queryFn para useQuery", async () => {
    const data = [{ id: "1" }];
    const fetcher = makeFetcher(data);
    const result = createApiQuery(["goals", "list"], fetcher) as unknown as {
      queryFn: () => Promise<typeof data>;
    };

    await expect(result.queryFn()).resolves.toEqual(data);
  });

  it("propaga rejeição do fetcher sem silenciar o erro", async () => {
    /**
     * Fetcher that always rejects to verify error propagation.
     *
     * @returns Rejected promise with a network error.
     */
    const fetcher = (): Promise<never> => Promise.reject(new Error("network"));
    const result = createApiQuery(["goals", "list"], fetcher) as unknown as {
      queryFn: () => Promise<never>;
    };

    await expect(result.queryFn()).rejects.toThrow("network");
  });

  it("encaminha options adicionais para useQuery", () => {
    const key = ["goals"] as const;
    const result = createApiQuery(key, makeFetcher(null), {
      staleTime: 60_000,
      enabled: false,
    }) as unknown as {
      queryKey: typeof key;
      staleTime: number;
      enabled: boolean;
    };

    expect(result.staleTime).toBe(60_000);
    expect(result.enabled).toBe(false);
  });

  it("options adicionais não sobrescrevem queryKey nem queryFn", async () => {
    const key = ["portfolio"] as const;
    const data = { total: 100 };
    const fetcher = makeFetcher(data);

    // Pass staleTime as extra option — key and fn must still be correct
    const result = createApiQuery(key, fetcher, {
      staleTime: 0,
    }) as unknown as {
      queryKey: typeof key;
      queryFn: () => Promise<typeof data>;
      staleTime: number;
    };

    expect(result.queryKey).toEqual(["portfolio"]);
    await expect(result.queryFn()).resolves.toEqual(data);
    expect(result.staleTime).toBe(0);
  });

  it("funciona sem options adicionais", () => {
    const result = createApiQuery(
      ["alerts"],
      makeFetcher([]),
    ) as unknown as { queryKey: string[] };

    expect(result.queryKey).toEqual(["alerts"]);
  });

  it("invoca useQuery exatamente uma vez por chamada", () => {
    createApiQuery(["test"], makeFetcher(null));

    expect(useQueryMock).toHaveBeenCalledOnce();
  });
});
