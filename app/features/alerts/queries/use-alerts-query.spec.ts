import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAlertsQuery } from "./use-alerts-query";
import type { AlertsPage } from "~/features/alerts/model/alerts";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal AlertsPage fixture for testing.
 *
 * @returns AlertsPage fixture with empty items.
 */
const makeAlertsPage = (): AlertsPage => ({
  items: [],
  total: 0,
});

describe("useAlertsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical alerts list query key", () => {
    const client = { getAlerts: vi.fn().mockResolvedValue(makeAlertsPage()) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useAlertsQuery(client as never) as unknown as {
      queryKey: readonly ["alerts", "list"];
    };

    expect(query.queryKey).toEqual(["alerts", "list"]);
  });

  it("calls client.getAlerts and returns the alerts page", async () => {
    const page = makeAlertsPage();
    const client = { getAlerts: vi.fn().mockResolvedValue(page) };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<AlertsPage> }) => opts);

    const query = useAlertsQuery(client as never) as unknown as {
      queryFn: () => Promise<AlertsPage>;
    };

    const result = await query.queryFn();

    expect(client.getAlerts).toHaveBeenCalledOnce();
    expect(result).toEqual(page);
  });

  it("propagates error from client.getAlerts without catching it", async () => {
    const client = {
      getAlerts: vi.fn().mockRejectedValue(new Error("network error")),
    };
    useQueryMock.mockImplementation((opts: { queryFn: () => Promise<AlertsPage> }) => opts);

    const query = useAlertsQuery(client as never) as unknown as {
      queryFn: () => Promise<AlertsPage>;
    };

    await expect(query.queryFn()).rejects.toThrow("network error");
  });
});
