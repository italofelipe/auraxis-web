import type { AxiosInstance } from "axios";
import { describe, expect, it, vi } from "vitest";

import { NotificationPreferencesApiClient } from "./notification-preferences.client";

const RESPONSE = {
  preferences: [
    { category: "due_soon", enabled: false, global_opt_out: false },
    { category: "goals", enabled: true, global_opt_out: false },
  ],
};

describe("NotificationPreferencesApiClient", () => {
  it("maps the enveloped GET response", async () => {
    const get = vi.fn().mockResolvedValue({ data: { success: true, data: RESPONSE }, headers: {} });
    const http = { get } as unknown as AxiosInstance;
    const client = new NotificationPreferencesApiClient(http);

    const prefs = await client.getPreferences();

    expect(get).toHaveBeenCalledWith("/user/notification-preferences");
    expect(prefs).toHaveLength(2);
    expect(prefs[0]).toEqual({ category: "due_soon", enabled: false, globalOptOut: false });
  });

  it("sends the PATCH payload and maps the response", async () => {
    const patch = vi.fn().mockResolvedValue({ data: RESPONSE, headers: {} });
    const http = { patch } as unknown as AxiosInstance;
    const client = new NotificationPreferencesApiClient(http);

    const result = await client.updatePreferences([
      { category: "wallet", enabled: true, globalOptOut: false },
    ]);

    expect(patch).toHaveBeenCalledWith("/user/notification-preferences", {
      preferences: [{ category: "wallet", enabled: true, global_opt_out: false }],
    });
    expect(result).toHaveLength(2);
  });
});
