import { describe, expect, it, vi } from "vitest";

import { DashboardSurvivalIndexApiClient } from "~/features/dashboard/services/dashboard-survival-index.client";

/**
 * Creates a minimal HTTP mock for the survival-index API client.
 *
 * @returns HTTP mock with a `get` spy.
 */
const createHttpMock = (): { get: ReturnType<typeof vi.fn> } => {
  return { get: vi.fn() };
};

describe("DashboardSurvivalIndexApiClient", () => {
  it("calls GET /dashboard/survival-index and maps DTO to domain", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: {
        n_months: 8.4,
        total_assets: 120_000,
        avg_monthly_expense: 14_200,
        classification: "ok",
      },
    });

    const client = new DashboardSurvivalIndexApiClient(http as never);
    const result = await client.getSurvivalIndex();

    expect(http.get).toHaveBeenCalledWith("/dashboard/survival-index");
    expect(result).toEqual({
      months: 8.4,
      totalAssets: 120_000,
      avgMonthlyExpense: 14_200,
      classification: "ok",
    });
  });

  it("preserves null months when backend cannot compute", async () => {
    const http = createHttpMock();
    http.get.mockResolvedValue({
      data: {
        n_months: null,
        total_assets: 0,
        avg_monthly_expense: 0,
        classification: null,
      },
    });

    const client = new DashboardSurvivalIndexApiClient(http as never);
    const result = await client.getSurvivalIndex();

    expect(result.months).toBeNull();
    expect(result.classification).toBeNull();
  });

  it("propagates HTTP errors without masking", async () => {
    const http = createHttpMock();
    http.get.mockRejectedValue(new Error("network failure"));

    const client = new DashboardSurvivalIndexApiClient(http as never);
    await expect(client.getSurvivalIndex()).rejects.toThrow("network failure");
  });
});
