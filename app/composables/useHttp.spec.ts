import { describe, expect, it } from "vitest";

import { createHttpClient, normalizeBaseUrl } from "./useHttp";

describe("useHttp helpers", () => {
  it("remove barras finais da base URL", () => {
    expect(normalizeBaseUrl("http://localhost:5000///")).toBe("http://localhost:5000");
  });

  it("configura cliente axios com base normalizada", () => {
    const client = createHttpClient("http://localhost:5000///", () => null);

    expect(client.defaults.baseURL).toBe("http://localhost:5000");
    expect(client.defaults.timeout).toBe(15000);
  });
});
