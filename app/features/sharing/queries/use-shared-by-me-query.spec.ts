import { describe, expect, it, vi } from "vitest";

import { useSharedByMeQuery } from "./use-shared-entries-query";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useSharedByMeQuery", () => {
  it("propagates error from client.getSharedByMe without catching it", async () => {
    const client = {
      getSharedByMe: vi.fn().mockRejectedValue(new Error("server error")),
    };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<unknown> }) => opts,
    );

    const query = useSharedByMeQuery(client as never) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
