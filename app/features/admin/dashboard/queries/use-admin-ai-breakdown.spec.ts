import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminAiBreakdown } from "~/features/admin/dashboard/model/admin-metrics";
import {
  adminAiBreakdownQueryKey,
  useAdminAiBreakdownQuery,
} from "./use-admin-ai-breakdown";
import { ADMIN_METRICS_TIMESERIES_STALE_TIME_MS } from "./use-admin-metrics-timeseries";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

const breakdown: AdminAiBreakdown = { by: "model", rows: [] };

interface CapturedOptions {
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<AdminAiBreakdown>;
  readonly staleTime: number;
}

describe("useAdminAiBreakdownQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((options: CapturedOptions) => options);
  });

  it("builds the breakdown cache key from dimension and limit", () => {
    const client = { getAiBreakdown: vi.fn().mockResolvedValue(breakdown) };

    const query = useAdminAiBreakdownQuery(
      { by: "model", limit: 5 },
      client as never,
    ) as unknown as CapturedOptions;

    expect(query.queryKey).toEqual(adminAiBreakdownQueryKey({ by: "model", limit: 5 }));
    expect(query.queryKey).toEqual([
      "admin",
      "metrics",
      "ai",
      "breakdown",
      { by: "model", limit: 5 },
    ]);
  });

  it("reuses the heavy-aggregation staleTime (900 s)", () => {
    const client = { getAiBreakdown: vi.fn().mockResolvedValue(breakdown) };

    const query = useAdminAiBreakdownQuery(
      { by: "model" },
      client as never,
    ) as unknown as CapturedOptions;

    expect(query.staleTime).toBe(ADMIN_METRICS_TIMESERIES_STALE_TIME_MS);
  });

  it("delegates fetching to the metrics client", async () => {
    const client = { getAiBreakdown: vi.fn().mockResolvedValue(breakdown) };

    const query = useAdminAiBreakdownQuery(
      { by: "model", limit: 5 },
      client as never,
    ) as unknown as CapturedOptions;
    const result = await query.queryFn();

    expect(client.getAiBreakdown).toHaveBeenCalledWith({ by: "model", limit: 5 });
    expect(result).toBe(breakdown);
  });

  it("propagates client errors without catching them", async () => {
    const client = { getAiBreakdown: vi.fn().mockRejectedValue(new Error("boom")) };

    const query = useAdminAiBreakdownQuery(
      { by: "model" },
      client as never,
    ) as unknown as CapturedOptions;

    await expect(query.queryFn()).rejects.toThrow("boom");
  });
});
