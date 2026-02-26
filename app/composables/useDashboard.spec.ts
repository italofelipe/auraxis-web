import { describe, expect, it, vi } from "vitest";

import { createDashboardApi } from "./useDashboard";

describe("createDashboardApi", () => {
  it("busca overview no endpoint de dashboard", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        currentBalance: 100,
        monthly: [
          {
            month: "2026-02",
            incomes: 120,
            expenses: 20,
            balance: 100,
          },
        ],
      },
    });

    const dashboardApi = createDashboardApi({ get });
    const response = await dashboardApi.getOverview();

    expect(get).toHaveBeenCalledWith("/dashboard/overview");
    expect(response.currentBalance).toBe(100);
    expect(response.monthly[0]?.month).toBe("2026-02");
  });
});
