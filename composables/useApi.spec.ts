import { describe, expect, it, vi } from "vitest";

import { createApiClient, useApi } from "./useApi";

describe("createApiClient", () => {
  it("normaliza base URL com barras finais", () => {
    const fetcher = vi.fn();
    const client = createApiClient(fetcher, "http://localhost:5000///");

    expect(client.getBaseUrl()).toBe("http://localhost:5000");
  });

  it("chama endpoint /health com metodo GET", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: "ok" });
    const client = createApiClient(fetcher, "http://localhost:5000");

    await expect(client.checkHealth()).resolves.toEqual({ status: "ok" });
    expect(fetcher).toHaveBeenCalledWith("http://localhost:5000/health", { method: "GET" });
  });
});

describe("useApi", () => {
  it("usa runtimeConfig.public.apiBase quando definido", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: "ok" });
    const client = useApi(() => ({ public: { apiBase: "http://api.local/" } }), fetcher);

    await expect(client.checkHealth()).resolves.toEqual({ status: "ok" });
    expect(client.getBaseUrl()).toBe("http://api.local");
    expect(fetcher).toHaveBeenCalledWith("http://api.local/health", { method: "GET" });
  });

  it("aplica fallback para localhost quando apiBase nao existe", async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: "ok" });
    const client = useApi(() => ({ public: {} }), fetcher);

    await expect(client.checkHealth()).resolves.toEqual({ status: "ok" });
    expect(client.getBaseUrl()).toBe("http://localhost:5000");
    expect(fetcher).toHaveBeenCalledWith("http://localhost:5000/health", { method: "GET" });
  });
});
