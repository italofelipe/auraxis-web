import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAlertPreferencesQuery } from "./use-alert-preferences-query";
import type { AlertPreference } from "~/features/alerts/model/alerts";

const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/core/config", () => ({
  isMockDataEnabled: (): boolean => false,
}));

/**
 * Builds a minimal AlertPreference fixture for testing.
 *
 * @returns AlertPreference fixture.
 */
const makeAlertPreference = (): AlertPreference => ({
  id: "pref-1",
  category: "system",
  enabled: true,
  channels: ["email"],
});

describe("useAlertPreferencesQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers with the canonical alerts preferences query key", () => {
    const client = { getPreferences: vi.fn().mockResolvedValue([makeAlertPreference()]) };
    useQueryMock.mockImplementation((opts: Record<string, unknown>) => opts);

    const query = useAlertPreferencesQuery(client as never) as unknown as {
      queryKey: readonly ["alerts", "preferences"];
    };

    expect(query.queryKey).toEqual(["alerts", "preferences"]);
  });

  it("calls client.getPreferences and returns the preferences array", async () => {
    const preferences = [makeAlertPreference()];
    const client = { getPreferences: vi.fn().mockResolvedValue(preferences) };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<AlertPreference[]> }) => opts,
    );

    const query = useAlertPreferencesQuery(client as never) as unknown as {
      queryFn: () => Promise<AlertPreference[]>;
    };

    const result = await query.queryFn();

    expect(client.getPreferences).toHaveBeenCalledOnce();
    expect(result).toEqual(preferences);
  });

  it("propagates error from client.getPreferences without catching it", async () => {
    const client = {
      getPreferences: vi.fn().mockRejectedValue(new Error("server error")),
    };
    useQueryMock.mockImplementation(
      (opts: { queryFn: () => Promise<AlertPreference[]> }) => opts,
    );

    const query = useAlertPreferencesQuery(client as never) as unknown as {
      queryFn: () => Promise<AlertPreference[]>;
    };

    await expect(query.queryFn()).rejects.toThrow("server error");
  });
});
