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

  it("requests a JSON data export package", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            request_id: "export-1",
            status: "queued",
          },
        },
      }),
    };
    const client = new PrivacyCenterClient(http as never);

    const result = await client.requestDataExport();

    expect(http.post).toHaveBeenCalledWith("/me/data-export", { format: "json" });
    expect(result.request_id).toBe("export-1");
  });

  it("requests deletion with password confirmation and reason", async () => {
    const http = {
      post: vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: {
            request_id: "delete-1",
            status: "scheduled",
            scheduled_for: "2026-05-20T00:00:00Z",
          },
        },
      }),
    };
    const client = new PrivacyCenterClient(http as never);

    await client.requestDeletion({ password: "ValidPassword1!", reason: "Teste LGPD" });

    expect(http.post).toHaveBeenCalledWith("/me/deletion-requests", {
      password: "ValidPassword1!",
      reason: "Teste LGPD",
    });
  });
});
