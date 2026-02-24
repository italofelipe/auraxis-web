import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./useApi";

describe("createApiClient", () => {
  it("normaliza base URL com barra final", () => {
    const fetcher = vi.fn();
    const client = createApiClient(fetcher, "http://localhost:5000/");

    expect(client.getBaseUrl()).toBe("http://localhost:5000");
  });

  it("chama endpoint /health com metodo GET", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: "ok" });
    const client = createApiClient(fetcher, "http://localhost:5000");

    await expect(client.checkHealth()).resolves.toEqual({ status: "ok" });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:5000/health", { method: "GET" });
  });
});
