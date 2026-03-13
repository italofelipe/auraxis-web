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
});
