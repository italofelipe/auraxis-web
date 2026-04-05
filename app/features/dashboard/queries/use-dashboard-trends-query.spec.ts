import { describe, expect, it, vi } from "vitest";

import { useDashboardTrendsQuery } from "~/features/dashboard/queries/use-dashboard-trends-query";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useDashboardTrendsQuery", () => {
  it("builds the correct query key for the default 6-month window", () => {
    const client = {
      getTrends: vi.fn().mockResolvedValue({ months: 6, series: [] }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardTrendsQuery(6, client as never) as unknown as {
      queryKey: { value: unknown };
    };

    expect(query.queryKey.value).toEqual(["dashboard", "trends", 6]);
  });

  it("builds the correct query key for a custom months value", () => {
    const client = {
      getTrends: vi.fn().mockResolvedValue({ months: 12, series: [] }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardTrendsQuery(12, client as never) as unknown as {
      queryKey: { value: unknown };
    };

    expect(query.queryKey.value).toEqual(["dashboard", "trends", 12]);
  });

  it("calls getTrends with the resolved months value", async () => {
    const mockSeries = [{ month: "2026-01", income: 1000, expenses: 700, balance: 300 }];
    const client = {
      getTrends: vi.fn().mockResolvedValue({ months: 6, series: mockSeries }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardTrendsQuery(6, client as never) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await query.queryFn();

    expect(client.getTrends).toHaveBeenCalledWith(6);
  });

  it("propagates API errors without masking them", async () => {
    const client = {
      getTrends: vi.fn().mockRejectedValue(new Error("trends unavailable")),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardTrendsQuery(6, client as never) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("trends unavailable");
  });

  it("uses 5-minute stale time", () => {
    const client = {
      getTrends: vi.fn().mockResolvedValue({ months: 6, series: [] }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardTrendsQuery(6, client as never) as unknown as {
      staleTime: number;
    };

    expect(query.staleTime).toBe(5 * 60_000);
  });

  it("reacts to a reactive months ref", () => {
    const client = {
      getTrends: vi.fn().mockResolvedValue({ months: 3, series: [] }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const months = ref(3);
    const query = useDashboardTrendsQuery(months, client as never) as unknown as {
      queryKey: { value: unknown };
    };

    expect(query.queryKey.value).toEqual(["dashboard", "trends", 3]);
  });
});
