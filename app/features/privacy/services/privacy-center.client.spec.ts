import { describe, expect, it, vi } from "vitest";

import { PrivacyCenterClient } from "./privacy-center.client";

describe("PrivacyCenterClient", () => {
  it("loads consent records from /me/consents", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            items: [{ kind: "ai", action: "granted" }],
            total: 1,
          },
        },
      }),
    };
    const client = new PrivacyCenterClient(http as never);

    const result = await client.listConsents();

    expect(http.get).toHaveBeenCalledWith("/me/consents");
    expect(result.items[0]?.kind).toBe("ai");
  });

  it("records a versioned consent grant on /me/consents", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({ data: { success: true, data: null } }),
    };
    const client = new PrivacyCenterClient(http as never);

    await client.recordConsent({ kind: "terms", version: "2.1.0" });

    expect(http.post).toHaveBeenCalledWith("/me/consents", {
      kind: "terms",
      version: "2.1.0",
      action: "granted",
      source: "web",
    });
  });

  it("fetches the LGPD export package from GET /user/me/export", async () => {
    const http = {
      get: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            metadata: {
              generated_at: "2026-05-17T06:00:00+00:00",
              scope: "lgpd_full_export",
            },
            users: [{ id: "uuid" }],
            retentions: [],
          },
        },
      }),
    };
    const client = new PrivacyCenterClient(http as never);

    const result = await client.requestDataExport();

    expect(http.get).toHaveBeenCalledWith("/user/me/export");
    expect(result.metadata?.scope).toBe("lgpd_full_export");
  });
});
