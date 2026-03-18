import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReceivablesQuery } from "./use-receivables-query";
import type { ReceivableEntry } from "~/features/receivables/model/receivables";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal ReceivableEntry fixture for testing.
 *
 * @returns ReceivableEntry fixture with pending status.
 */
const makeReceivableEntry = (): ReceivableEntry => ({
  id: "entry-1",
  description: "Consultoria",
  amount: 5000,
  expectedDate: "2026-03-31",
  receivedDate: null,
  status: "pending",
  category: "Consultoria",
  createdAt: "2026-03-01T00:00:00.000Z",
});

describe("useReceivablesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates error from client.listReceivables without catching it", async () => {
    const client = {
      listReceivables: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<ReceivableEntry[]> }) => opts);

    const query = useReceivablesQuery(undefined, client as never) as unknown as {
      queryFn: () => Promise<ReceivableEntry[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });

  it("calls client.listReceivables and returns mapped entries", async () => {
    const entry = makeReceivableEntry();
    const client = {
      listReceivables: vi.fn().mockResolvedValue([entry]),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<ReceivableEntry[]> }) => opts);

    const query = useReceivablesQuery(undefined, client as never) as unknown as {
      queryFn: () => Promise<ReceivableEntry[]>;
    };

    const result = await query.queryFn();

    expect(client.listReceivables).toHaveBeenCalledOnce();
    expect(result).toEqual([entry]);
  });
});
