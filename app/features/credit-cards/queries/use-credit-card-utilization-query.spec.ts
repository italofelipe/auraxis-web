import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreditCardUtilizationQuery } from "./use-credit-card-utilization-query";
import type { CreditCardsClient } from "~/features/credit-cards/services/credit-cards.client";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({ useQuery: useQueryMock }));

describe("useCreditCardUtilizationQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);
  });

  it("usa a query key da feature com id e utilization", () => {
    const q = useCreditCardUtilizationQuery("cc-1", {
      getUtilization: vi.fn(),
    } as unknown as CreditCardsClient) as unknown as { queryKey: unknown[] };
    expect(q.queryKey).toEqual(["credit-cards", "cc-1", "utilization"]);
  });

  it("delega o fetch ao client.getUtilization", async () => {
    const getUtilization = vi.fn().mockResolvedValue({});
    const q = useCreditCardUtilizationQuery("cc-3", {
      getUtilization,
    } as unknown as CreditCardsClient) as unknown as {
      queryFn: () => Promise<unknown>;
    };
    await q.queryFn();
    expect(getUtilization).toHaveBeenCalledWith("cc-3");
  });
});
