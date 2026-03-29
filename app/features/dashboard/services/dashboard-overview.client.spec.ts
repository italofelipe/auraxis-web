import { describe, expect, it, vi } from "vitest";

import { DashboardOverviewApiClient } from "~/features/dashboard/services/dashboard-overview.client";
import { DashboardOverviewFiltersError } from "~/features/dashboard/services/dashboard-overview.errors";

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
  it("sends month=YYYY-MM param and maps the rich overview payload", async () => {
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

    // The client must send month=YYYY-MM, not period=<preset>
    expect(http.get).toHaveBeenCalledWith("/dashboard/overview", {
      params: expect.objectContaining({ month: expect.stringMatching(/^\d{4}-\d{2}$/) }),
    });
    expect(result.summary.upcomingDueTotal).toBe(150);
    expect(result.portfolio.currentValue).toBe(12000);
  });

  it("maps simplified backend response (month/totals/counts/top_categories)", async () => {
    const http = createHttpMock();
    // Backend v2 wrapper with simplified data
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: "Overview do dashboard calculado com sucesso",
        data: {
          month: "2026-03",
          totals: { income_total: 5000, expense_total: 3200, balance: 1800 },
          counts: { total_transactions: 14 },
          top_categories: { expense: [], income: [] },
        },
      },
    });

    const client = new DashboardOverviewApiClient(http as never);
    const result = await client.getOverview({ period: "current_month" });

    expect(result.summary.income).toBe(5000);
    expect(result.summary.expense).toBe(3200);
    expect(result.summary.balance).toBe(1800);
    expect(result.period.label).toContain("2026");
  });

  it("requires start for custom periods", async () => {
    const client = new DashboardOverviewApiClient(createHttpMock() as never);

    await expect(
      client.getOverview({ period: "custom" }),
    ).rejects.toBeInstanceOf(DashboardOverviewFiltersError);
  });

  it("derives YYYY-MM from custom period start date", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: {
        period: {
          key: "custom",
          start: "2026-02-01",
          end: "2026-02-28",
          label: "Fevereiro 2026",
        },
        summary: { income: 0, expense: 0, balance: 0, upcoming_due_total: 0, net_worth: 0 },
        comparison: {
          income_vs_previous_month_percent: null,
          expense_vs_previous_month_percent: null,
          balance_vs_previous_month_percent: null,
        },
        timeseries: [],
        expenses_by_category: [],
        upcoming_dues: [],
        goals: [],
        portfolio: { current_value: 0, change_percent: null },
        alerts: [],
      },
    });

    const client = new DashboardOverviewApiClient(http as never);
    await client.getOverview({ period: "custom", start: "2026-02-01", end: "2026-02-28" });

    expect(http.get).toHaveBeenCalledWith("/dashboard/overview", {
      params: { month: "2026-02" },
    });
  });
});
