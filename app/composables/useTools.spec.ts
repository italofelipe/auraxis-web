import type { ToolsCatalog } from "~/types/contracts";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { applyToolsFlags, createToolsApi, useToolsCatalogQuery } from "./useTools";

const useQueryMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn());
const isFeatureEnabledMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useQuery: useQueryMock,
}));

vi.mock("~/composables/useHttp", () => ({
  useHttp: useHttpMock,
}));

vi.mock("~/shared/feature-flags", () => ({
  isFeatureEnabled: isFeatureEnabledMock,
}));

describe("useTools composable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isFeatureEnabledMock.mockReturnValue(false);
  });

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

  it("retorna catalogo remoto quando query executa com sucesso", async () => {
    const remoteCatalog: ToolsCatalog = {
      tools: [
        {
          id: "remote-1",
          name: "Ferramenta remota",
          description: "Fonte backend",
          enabled: true,
        },
      ],
    };

    useHttpMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: remoteCatalog }),
    });
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<ToolsCatalog> }) => options);

    const query = useToolsCatalogQuery() as unknown as {
      queryFn: () => Promise<ToolsCatalog>;
    };
    const result = await query.queryFn();

    expect(result).toEqual(remoteCatalog);
  });

  it("retorna placeholder quando backend falha", async () => {
    useHttpMock.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error("backend down")),
    });
    useQueryMock.mockImplementation((options: { queryFn: () => Promise<ToolsCatalog> }) => options);

    const query = useToolsCatalogQuery() as unknown as {
      queryFn: () => Promise<ToolsCatalog>;
    };
    const result = await query.queryFn();

    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.tools[0]?.id).toBe("raise-calculator");
    expect(result.tools[0]?.enabled).toBe(false);
  });

  it("aplica override da flag para calculadora de aumento", () => {
    isFeatureEnabledMock.mockReturnValue(true);
    const catalog: ToolsCatalog = {
      tools: [
        {
          id: "raise-calculator",
          name: "Pedir aumento",
          description: "Descricao",
          enabled: false,
        },
      ],
    };

    const result = applyToolsFlags(catalog);

    expect(result.tools[0]?.enabled).toBe(true);
    expect(isFeatureEnabledMock).toHaveBeenCalledWith("web.tools.salary-raise-calculator");
  });
});
