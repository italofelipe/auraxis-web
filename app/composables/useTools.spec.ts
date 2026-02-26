import { describe, expect, it, vi } from "vitest";

import { createToolsApi } from "./useTools";

describe("createToolsApi", () => {
  it("carrega catalogo de ferramentas", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        tools: [
          {
            id: "raise",
            name: "Pedir aumento",
            description: "Descricao",
            enabled: false,
          },
        ],
      },
    });

    const toolsApi = createToolsApi({ get });
    const response = await toolsApi.getCatalog();

    expect(get).toHaveBeenCalledWith("/tools/catalog");
    expect(response.tools[0]?.name).toBe("Pedir aumento");
  });
});
