import { describe, it, expect, vi } from "vitest";

import { useSharedByMeQuery } from "./use-shared-by-me-query";
import type { SharedEntryDto } from "~/features/shared-entries/contracts/shared-entry.dto";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: vi.fn().mockReturnValue(false),
}));

/**
 * Creates a minimal valid SharedEntryDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete SharedEntryDto fixture.
 */
const makeEntry = (overrides: Partial<SharedEntryDto> = {}): SharedEntryDto => ({
  id: "se-by-001",
  owner_id: "user-owner-001",
  transaction_id: "txn-001",
  transaction_title: "Jantar de teste",
  transaction_amount: 400,
  my_share: 200,
  other_party_email: "friend@example.com",
  split_type: "equal",
  status: "pending",
  created_at: "2026-03-20T10:00:00Z",
  updated_at: "2026-03-20T10:00:00Z",
  ...overrides,
});

describe("useSharedByMeQuery", () => {
  it("uses queryKey ['shared-entries', 'by-me']", () => {
    const client = { getSharedByMe: vi.fn().mockResolvedValue([]) };

    useQueryMock.mockImplementation((opts: { queryKey: readonly string[] }) => opts);

    const result = useSharedByMeQuery(client as never) as unknown as {
      queryKey: readonly string[];
    };

    expect(result.queryKey).toEqual(["shared-entries", "by-me"]);
  });

  it("delegates to client.getSharedByMe when mock data is disabled", async () => {
    const entries = [makeEntry()];
    const client = { getSharedByMe: vi.fn().mockResolvedValue(entries) };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<unknown> }) => opts,
    );

    const query = useSharedByMeQuery(client as never) as unknown as {
      queryFn: () => Promise<SharedEntryDto[]>;
    };

    const result = await query.queryFn();

    expect(client.getSharedByMe).toHaveBeenCalledOnce();
    expect(result).toEqual(entries);
  });

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
