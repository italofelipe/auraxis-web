import { describe, expect, it, vi } from "vitest";

import { useDashboardOverviewQuery } from "~/composables/useDashboard";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useDashboard composable facade", () => {
  it("reexports the canonical dashboard overview query", () => {
    const client = {
      getOverview: vi.fn().mockResolvedValue({ ok: true }),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "6m" },
      client as never,
    ) as unknown as {
      queryKey: { value: unknown };
      queryFn: () => Promise<unknown>;
    };

    expect(query.queryKey.value).toEqual([
      "dashboard",
      "overview",
      { period: "6m" },
    ]);
  });

  it("propagates error through the facade without masking it", async () => {
    const client = {
      getOverview: vi.fn().mockRejectedValue(new Error("backend unavailable")),
    };

    useQueryMock.mockImplementation((options: Record<string, unknown>) => options);

    const query = useDashboardOverviewQuery(
      { period: "current_month" },
      client as never,
    ) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("backend unavailable");
  });
});
