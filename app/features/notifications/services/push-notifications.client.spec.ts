import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";

import { PushNotificationsClient } from "./push-notifications.client";

describe("PushNotificationsClient", () => {
  it("POSTs the payload to /notifications/subscribe", async () => {
    const post = vi.fn().mockResolvedValue({ data: null });
    const http = { post } as unknown as AxiosInstance;
    const client = new PushNotificationsClient(http);

    await client.subscribe({
      endpoint: "https://push.example/abc",
      expiration_time: null,
      keys: { p256dh: "pub", auth: "auth" },
    });

    expect(post).toHaveBeenCalledWith("/notifications/subscribe", {
      endpoint: "https://push.example/abc",
      expiration_time: null,
      keys: { p256dh: "pub", auth: "auth" },
    });
  });

  it("POSTs the endpoint to /notifications/unsubscribe", async () => {
    const post = vi.fn().mockResolvedValue({ data: null });
    const http = { post } as unknown as AxiosInstance;
    const client = new PushNotificationsClient(http);

    await client.unsubscribe("https://push.example/abc");

    expect(post).toHaveBeenCalledWith("/notifications/unsubscribe", {
      endpoint: "https://push.example/abc",
    });
  });

  it("propagates backend errors without swallowing", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network down"));
    const http = { post } as unknown as AxiosInstance;
    const client = new PushNotificationsClient(http);

    await expect(
      client.subscribe({
        endpoint: "e",
        expiration_time: null,
        keys: { p256dh: "p", auth: "a" },
      }),
    ).rejects.toThrow("network down");
  });
});
