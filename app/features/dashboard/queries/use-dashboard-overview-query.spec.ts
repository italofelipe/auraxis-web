import { describe, expect, it, vi } from "vitest";

import { useDashboardOverviewQuery } from "~/features/dashboard/queries/use-dashboard-overview-query";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useDashboardOverviewQuery", () => {
  it("builds a stable query around canonical filters", async () => {
    const client = {
      getOverview: vi.fn().mockResolvedValue({ ok: true }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "3m" },
      client as never,
    ) as unknown as {
      queryKey: { value: unknown };
      queryFn: () => Promise<unknown>;
    };

    expect(query.queryKey.value).toEqual([
      "dashboard",
      "overview",
      { period: "3m" },
    ]);

    await query.queryFn();

    expect(client.getOverview).toHaveBeenCalledWith({ period: "3m" });
  });

  it("propagates API error so Vue Query surfaces isError state", async () => {
    const client = {
      getOverview: vi.fn().mockRejectedValue(new Error("API unavailable")),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "current_month" },
      client as never,
    ) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("API unavailable");
  });

  it("does not fall back to placeholder data when API throws", async () => {
    const client = {
      getOverview: vi.fn().mockRejectedValue(new Error("contract drift")),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "6m" },
      client as never,
    ) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    let caught: unknown;
    try {
      await query.queryFn();
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(Error);
  });

  it("disables query when custom period is missing start or end", () => {
    const client = {
      getOverview: vi.fn(),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "custom" },
      client as never,
    ) as unknown as {
      enabled: { value: boolean };
    };

    expect(query.enabled.value).toBe(false);
  });

  it("enables query when custom period has both start and end", () => {
    const client = {
      getOverview: vi.fn(),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "custom", start: "2026-03-01", end: "2026-03-31" },
      client as never,
    ) as unknown as {
      enabled: { value: boolean };
    };

    expect(query.enabled.value).toBe(true);
  });
});
