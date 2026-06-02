import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreditCardBillQuery } from "./use-credit-card-bill-query";
import type { CreditCardsClient } from "~/features/credit-cards/services/credit-cards.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({ useQuery: useQueryMock }));

describe("useCreditCardBillQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);
  });

  it("usa a query key da feature com id, bill e month", () => {
    const q = useCreditCardBillQuery("cc-1", "2026-06", {
      getBill: vi.fn(),
    } as unknown as CreditCardsClient) as unknown as { queryKey: unknown[] };
    expect(q.queryKey).toEqual(["credit-cards", "cc-1", "bill", "2026-06"]);
  });

  it("delega o fetch ao client.getBill com id+month resolvidos", async () => {
    const getBill = vi.fn().mockResolvedValue({});
    const q = useCreditCardBillQuery("cc-9", "2026-07", {
      getBill,
    } as unknown as CreditCardsClient) as unknown as {
      queryFn: () => Promise<unknown>;
    };
    await q.queryFn();
    expect(getBill).toHaveBeenCalledWith("cc-9", "2026-07");
  });
});
