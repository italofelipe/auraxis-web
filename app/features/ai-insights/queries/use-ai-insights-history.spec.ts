import { beforeEach, describe, expect, it, vi } from "vitest";
import { unref } from "vue";

import { useAIInsightsHistory } from "./use-ai-insights-history";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useAIInsightsHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((options: unknown) => options);
  });

  it("uses page and perPage in the cache key", () => {
    const client = { fetchInsightHistory: vi.fn().mockResolvedValue({ items: [] }) };

    const query = useAIInsightsHistory(2, 10, client as never) as unknown as {
      queryKey: readonly unknown[];
    };

    expect(unref(query.queryKey)).toEqual(["ai-insights", "history", { page: 2, perPage: 10 }]);
  });

  it("delegates pagination params to the client", async () => {
    const client = {
      fetchInsightHistory: vi.fn().mockResolvedValue({ items: [], page: 3, per_page: 5, total: 0 }),
    };

    const query = useAIInsightsHistory(3, 5, client as never) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await query.queryFn();

    expect(client.fetchInsightHistory).toHaveBeenCalledWith(3, 5);
  });
});
