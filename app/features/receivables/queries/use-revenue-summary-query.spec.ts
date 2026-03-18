import { beforeEach, describe, expect, it, vi } from "vitest";

import { useRevenueSummaryQuery } from "./use-revenue-summary-query";
import type { RevenueSummary } from "~/features/receivables/model/receivables";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

describe("useRevenueSummaryQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates error from client.getSummary without catching it", async () => {
    const client = {
      getSummary: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<RevenueSummary> }) => opts);

    const query = useRevenueSummaryQuery(client as never) as unknown as {
      queryFn: () => Promise<RevenueSummary>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
