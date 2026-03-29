import { describe, it, expect, vi } from "vitest";

import { useSharedWithMeQuery } from "./use-shared-with-me-query";
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
  id: "se-with-001",
  owner_id: "user-sender-001",
  transaction_id: "txn-101",
  transaction_title: "Churrasco de teste",
  transaction_amount: 800,
  my_share: 200,
  other_party_email: "sender@example.com",
  split_type: "equal",
  status: "pending",
  created_at: "2026-03-22T17:00:00Z",
  updated_at: "2026-03-22T17:00:00Z",
  ...overrides,
});

describe("useSharedWithMeQuery", () => {
  it("uses queryKey ['shared-entries', 'with-me']", () => {
    const client = { getSharedWithMe: vi.fn().mockResolvedValue([]) };

    useQueryMock.mockImplementation((opts: { queryKey: readonly string[] }) => opts);

    const result = useSharedWithMeQuery(client as never) as unknown as {
      queryKey: readonly string[];
    };

    expect(result.queryKey).toEqual(["shared-entries", "with-me"]);
  });

  it("delegates to client.getSharedWithMe when mock data is disabled", async () => {
    const entries = [makeEntry()];
    const client = { getSharedWithMe: vi.fn().mockResolvedValue(entries) };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<unknown> }) => opts,
    );

    const query = useSharedWithMeQuery(client as never) as unknown as {
      queryFn: () => Promise<SharedEntryDto[]>;
    };

    const result = await query.queryFn();

    expect(client.getSharedWithMe).toHaveBeenCalledOnce();
    expect(result).toEqual(entries);
  });

  it("propagates error from client.getSharedWithMe without catching it", async () => {
    const client = {
      getSharedWithMe: vi.fn().mockRejectedValue(new Error("upstream error")),
    };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<unknown> }) => opts,
    );

    const query = useSharedWithMeQuery(client as never) as unknown as {
      queryFn: () => Promise<unknown>;
    };

    await expect(query.queryFn()).rejects.toThrow("upstream error");
  });
});
