import { describe, expect, it, vi } from "vitest";

import { useSpendingPatternsLatestQuery } from "./use-spending-patterns-latest-query";
import type { SpendingPatternsApiClient } from "~/features/spending-patterns/services/spending-patterns.client";
import type { SpendingPatternsLatest } from "~/features/spending-patterns/model/spending-patterns";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

interface CapturedConfig {
  queryKey: readonly unknown[];
  queryFn: () => Promise<SpendingPatternsLatest>;
  enabled: () => boolean;
}

describe("useSpendingPatternsLatestQuery", () => {
  it("reads from the cached endpoint via client.getLatest with a stable key", async () => {
    const latest: SpendingPatternsLatest = { patterns: [], generatedAt: null };
    const client = {
      getLatest: vi.fn().mockResolvedValue(latest),
    } as unknown as SpendingPatternsApiClient;

    useSpendingPatternsLatestQuery({}, client);

    const config = useQueryMock.mock.calls[0]?.[0] as CapturedConfig;
    expect(config.queryKey).toEqual(["spending-patterns", "latest"]);
    expect(config.enabled()).toBe(true);
    await expect(config.queryFn()).resolves.toBe(latest);
    expect(client.getLatest).toHaveBeenCalledOnce();
  });

  it("respects a disabled (non-premium) gate", () => {
    const client = { getLatest: vi.fn() } as unknown as SpendingPatternsApiClient;
    useSpendingPatternsLatestQuery({ enabled: false }, client);
    const config = useQueryMock.mock.calls.at(-1)?.[0] as CapturedConfig;
    expect(config.enabled()).toBe(false);
  });
});
