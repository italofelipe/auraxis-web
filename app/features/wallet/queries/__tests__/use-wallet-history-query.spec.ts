import { describe, expect, it, vi } from "vitest";
import { useWalletHistoryQuery } from "../use-wallet-history-query";
import type { WalletClient, WalletHistoryPoint } from "~/features/wallet/services/wallet.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

/**
 * Builds a minimal WalletHistoryPoint fixture.
 *
 * @param date - ISO date string for the data point.
 * @returns WalletHistoryPoint fixture.
 */
const makePoint = (date: string): WalletHistoryPoint => ({
  date,
  total_value: 1000,
  invested_amount: 900,
});

/**
 * Creates a minimal mock WalletClient for use in tests.
 *
 * @returns Mock WalletClient with stubbed methods.
 */
const makeMockClient = (): WalletClient =>
  ({
    getWalletHistory: vi.fn(),
  }) as unknown as WalletClient;

describe("useWalletHistoryQuery", () => {
  it("calls useQuery with the wallet-history query key", (): void => {
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const entryId = "abc-123";
    const mockClient = makeMockClient();
    useWalletHistoryQuery(entryId, mockClient);

    expect(useQueryMock).toHaveBeenCalledOnce();
    const call = useQueryMock.mock.calls[0];
    if (!call) { throw new Error("useQuery was not called"); }
    const opts = call[0] as { queryKey: unknown[] };
    expect(opts.queryKey).toEqual(["wallet", "history", entryId]);
  });

  it("returns empty array when entryId is null", async (): Promise<void> => {
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<WalletHistoryPoint[]> }) => opts,
    );

    const mockClient = makeMockClient();
    const query = useWalletHistoryQuery(null, mockClient) as unknown as {
      queryFn: () => Promise<WalletHistoryPoint[]>;
    };

    const result = await query.queryFn();
    expect(result).toEqual([]);
  });

  it("calls client.getWalletHistory with the correct id", async (): Promise<void> => {
    const points = [makePoint("2026-01-01"), makePoint("2026-01-02")];
    const client = { getWalletHistory: vi.fn().mockResolvedValue(points) };

    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<WalletHistoryPoint[]> }) => opts,
    );

    const query = useWalletHistoryQuery("entry-xyz", client as never) as unknown as {
      queryFn: () => Promise<WalletHistoryPoint[]>;
    };

    const result = await query.queryFn();
    expect(client.getWalletHistory).toHaveBeenCalledWith("entry-xyz");
    expect(result).toEqual(points);
  });

  it("query is disabled when entryId resolves to null", (): void => {
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const mockClient = makeMockClient();
    useWalletHistoryQuery(null, mockClient);

    const call = useQueryMock.mock.calls[0];
    if (!call) { throw new Error("useQuery was not called"); }
    const opts = call[0] as { enabled: () => boolean };
    expect(opts.enabled()).toBe(false);
  });

  it("query is enabled when entryId is a non-empty string", (): void => {
    useQueryMock.mockImplementation((opts: unknown) => opts);

    const mockClient = makeMockClient();
    useWalletHistoryQuery("some-id", mockClient);

    const call = useQueryMock.mock.calls[0];
    if (!call) { throw new Error("useQuery was not called"); }
    const opts = call[0] as { enabled: () => boolean };
    expect(opts.enabled()).toBe(true);
  });
});
