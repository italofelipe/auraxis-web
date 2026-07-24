import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminMetricsTimeseries } from "~/features/admin/dashboard/model/admin-metrics";
import {
  ADMIN_METRICS_TIMESERIES_STALE_TIME_MS,
  adminMetricsTimeseriesQueryKey,
  useAdminMetricsTimeseriesQuery,
} from "./use-admin-metrics-timeseries";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

const series: AdminMetricsTimeseries = { block: "users", interval: "day", points: [] };
const range = { from: "2026-06-25", to: "2026-07-24", interval: "day" as const };

interface CapturedOptions {
  readonly queryKey: { readonly value: readonly unknown[] };
  readonly queryFn: () => Promise<AdminMetricsTimeseries>;
  readonly staleTime: number;
}

describe("useAdminMetricsTimeseriesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((options: CapturedOptions) => options);
  });

  it("builds a per-block cache key including the requested window", () => {
    const client = { getTimeseries: vi.fn().mockResolvedValue(series) };

    const query = useAdminMetricsTimeseriesQuery(
      "users",
      () => range,
      client as never,
    ) as unknown as CapturedOptions;

    expect(query.queryKey.value).toEqual(adminMetricsTimeseriesQueryKey("users", range));
    expect(query.queryKey.value).toEqual([
      "admin",
      "metrics",
      "timeseries",
      "users",
      { from: "2026-06-25", to: "2026-07-24", interval: "day" },
    ]);
  });

  it("aligns staleTime with the backend timeseries cache TTL (900 s)", () => {
    const client = { getTimeseries: vi.fn().mockResolvedValue(series) };

    const query = useAdminMetricsTimeseriesQuery(
      "users",
      () => range,
      client as never,
    ) as unknown as CapturedOptions;

    expect(query.staleTime).toBe(ADMIN_METRICS_TIMESERIES_STALE_TIME_MS);
    expect(query.staleTime).toBe(900_000);
  });

  it("fetches the block series with the reactive window", async () => {
    const client = { getTimeseries: vi.fn().mockResolvedValue(series) };

    const query = useAdminMetricsTimeseriesQuery(
      "premium",
      () => range,
      client as never,
    ) as unknown as CapturedOptions;
    const result = await query.queryFn();

    expect(client.getTimeseries).toHaveBeenCalledWith("premium", range);
    expect(result).toBe(series);
  });

  it("propagates client errors without catching them", async () => {
    const client = { getTimeseries: vi.fn().mockRejectedValue(new Error("boom")) };

    const query = useAdminMetricsTimeseriesQuery(
      "ai",
      () => range,
      client as never,
    ) as unknown as CapturedOptions;

    await expect(query.queryFn()).rejects.toThrow("boom");
  });
});
