import { describe, expect, it, vi } from "vitest";

import { DashboardTrendsApiClient } from "~/features/dashboard/services/dashboard-trends.client";

/**
 * Creates a minimal HTTP mock for the trends API client.
 *
 * @returns HTTP mock with a `get` spy.
 */
const createHttpMock = (): { get: ReturnType<typeof vi.fn> } => {
  return { get: vi.fn() };
};

describe("DashboardTrendsApiClient", () => {
  it("calls GET /dashboard/trends with the correct months param", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: {
        months: 6,
        series: [
          { month: "2025-11", income: 4000, expenses: 2800, balance: 1200 },
          { month: "2025-12", income: 5200, expenses: 3100, balance: 2100 },
          { month: "2026-01", income: 4800, expenses: 3000, balance: 1800 },
          { month: "2026-02", income: 5500, expenses: 3400, balance: 2100 },
          { month: "2026-03", income: 6000, expenses: 3200, balance: 2800 },
          { month: "2026-04", income: 5000, expenses: 3200, balance: 1800 },
        ],
      },
    });

    const client = new DashboardTrendsApiClient(http as never);
    const result = await client.getTrends(6);

    expect(http.get).toHaveBeenCalledWith("/dashboard/trends", {
      params: { months: 6 },
    });
    expect(result.months).toBe(6);
    expect(result.series).toHaveLength(6);
    expect(result.series[0]).toEqual({
      month: "2025-11",
      income: 4000,
      expenses: 2800,
      balance: 1200,
    });
  });

  it("maps all series fields correctly", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: {
        months: 3,
        series: [
          { month: "2026-02", income: 3000, expenses: 2000, balance: 1000 },
          { month: "2026-03", income: 3500, expenses: 2200, balance: 1300 },
          { month: "2026-04", income: 4000, expenses: 2500, balance: 1500 },
        ],
      },
    });

    const client = new DashboardTrendsApiClient(http as never);
    const result = await client.getTrends(3);

    expect(result.months).toBe(3);
    expect(result.series[2]).toMatchObject({
      month: "2026-04",
      income: 4000,
      expenses: 2500,
      balance: 1500,
    });
  });

  it("returns an empty series array when API returns empty series", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: { months: 6, series: [] },
    });

    const client = new DashboardTrendsApiClient(http as never);
    const result = await client.getTrends(6);

    expect(result.series).toEqual([]);
  });

  it("propagates HTTP errors without masking them", async () => {
    const http = createHttpMock();
    http.get.mockRejectedValue(new Error("network failure"));

    const client = new DashboardTrendsApiClient(http as never);

    await expect(client.getTrends(6)).rejects.toThrow("network failure");
  });
});
