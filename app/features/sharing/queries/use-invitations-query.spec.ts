import { describe, expect, it, vi } from "vitest";

import { useInvitationsQuery } from "./use-invitations-query";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

describe("useInvitationsQuery", () => {
  it("propagates error from client.getInvitations without catching it", async () => {
    const client = {
      getInvitations: vi.fn().mockRejectedValue(new Error("network failure")),
    };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<unknown> }) => opts,
    );

    const query = useInvitationsQuery(client as never) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("network failure");
  });
});
