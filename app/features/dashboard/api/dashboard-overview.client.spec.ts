import { describe, expect, it, vi } from "vitest";

import { DashboardOverviewApiClient } from "~/features/dashboard/api/dashboard-overview.client";
import { DashboardOverviewFiltersError } from "~/features/dashboard/api/dashboard-overview.errors";

/**
 * Creates a minimal HTTP mock for the dashboard API client.
 *
 * @returns HTTP mock with a `get` spy.
 */
const createHttpMock = (): { get: ReturnType<typeof vi.fn> } => {
  return {
    get: vi.fn(),
  };
};

describe("DashboardOverviewApiClient", () => {
  it("maps overview payload using the canonical endpoint", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: {
        period: {
          key: "current_month",
          start: "2026-03-01",
          end: "2026-03-31",
          label: "Março 2026",
        },
        summary: {
          income: 1000,
          expense: 700,
          balance: 300,
          upcoming_due_total: 150,
          net_worth: 12000,
        },
        comparison: {
          income_vs_previous_month_percent: 10,
          expense_vs_previous_month_percent: -5,
          balance_vs_previous_month_percent: 20,
        },
        timeseries: [],
        expenses_by_category: [],
        upcoming_dues: [],
        goals: [],
        portfolio: {
          current_value: 12000,
          change_percent: 2.5,
        },
        alerts: [],
      },
    });

    const client = new DashboardOverviewApiClient(http as never);
    const result = await client.getOverview({ period: "current_month" });

    expect(http.get).toHaveBeenCalledWith("/dashboard/overview", {
      params: {
        period: "current_month",
      },
    });
    expect(result.summary.upcomingDueTotal).toBe(150);
    expect(result.portfolio.currentValue).toBe(12000);
  });

  it("requires start and end for custom periods", async () => {
    const client = new DashboardOverviewApiClient(createHttpMock() as never);

    await expect(
      client.getOverview({ period: "custom", start: "2026-03-01" }),
    ).rejects.toBeInstanceOf(DashboardOverviewFiltersError);
  });
});
