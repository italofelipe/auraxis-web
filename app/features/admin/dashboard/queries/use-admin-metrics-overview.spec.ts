import { beforeEach, describe, expect, it, vi } from "vitest";

import { STALE_TIME } from "~/core/query/stale-time";
import type { AdminMetricsOverview } from "~/features/admin/dashboard/model/admin-metrics";
import {
  adminMetricsOverviewQueryKey,
  useAdminMetricsOverviewQuery,
} from "./use-admin-metrics-overview";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

const overview = { generatedAt: "2026-07-24T18:00:00Z" } as AdminMetricsOverview;

interface CapturedOptions {
  readonly queryKey: readonly unknown[];
  readonly queryFn: () => Promise<AdminMetricsOverview>;
  readonly staleTime: number;
}

describe("useAdminMetricsOverviewQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((options: CapturedOptions) => options);
  });

  it("uses the admin metrics overview cache key", () => {
    const client = { getOverview: vi.fn().mockResolvedValue(overview) };

    const query = useAdminMetricsOverviewQuery(client as never) as unknown as CapturedOptions;

    expect(query.queryKey).toEqual(adminMetricsOverviewQueryKey());
    expect(query.queryKey).toEqual(["admin", "metrics", "overview"]);
  });

  it("aligns staleTime with the backend overview cache TTL (300 s)", () => {
    const client = { getOverview: vi.fn().mockResolvedValue(overview) };

    const query = useAdminMetricsOverviewQuery(client as never) as unknown as CapturedOptions;

    expect(query.staleTime).toBe(STALE_TIME.STABLE);
    expect(query.staleTime).toBe(300_000);
  });

  it("delegates fetching to the metrics client", async () => {
    const client = { getOverview: vi.fn().mockResolvedValue(overview) };

    const query = useAdminMetricsOverviewQuery(client as never) as unknown as CapturedOptions;
    const result = await query.queryFn();

    expect(client.getOverview).toHaveBeenCalledOnce();
    expect(result).toBe(overview);
  });

  it("propagates client errors without catching them", async () => {
    const client = { getOverview: vi.fn().mockRejectedValue(new Error("boom")) };

    const query = useAdminMetricsOverviewQuery(client as never) as unknown as CapturedOptions;

    await expect(query.queryFn()).rejects.toThrow("boom");
  });
});
