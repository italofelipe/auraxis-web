import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import type { ToolsCatalog } from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";
import { isFeatureEnabled } from "~/shared/feature-flags";

const toolsPlaceholder: ToolsCatalog = {
  tools: [
    {
      id: "raise-calculator",
      name: "Pedir aumento",
      description: "Calculo de inflacao + ganho real desejado.",
      enabled: false,
    },
    {
      id: "bill-forecast",
      name: "Simulador de contas",
      description: "Previsao de saldo apos contas recorrentes.",
      enabled: false,
    },
  ],
};

interface HttpAdapter {
  get<TResponse>(url: string): Promise<{ data: TResponse }>;
}

interface ToolsApi {
  getCatalog(): Promise<ToolsCatalog>;
}

/**
 * Aplica overrides de feature flags no catálogo de ferramentas.
 * @param catalog Catálogo base vindo do backend ou placeholder.
 * @returns Catálogo com campo `enabled` normalizado por flags locais.
 */
export const applyToolsFlags = (catalog: ToolsCatalog): ToolsCatalog => {
  const toolsWithFlags = catalog.tools.map((tool): ToolsCatalog["tools"][number] => {
    if (tool.id !== "raise-calculator") {
      return tool;
    }

    const isRaiseCalculatorEnabled = isFeatureEnabled("web.tools.salary-raise-calculator");
    return {
      ...tool,
      enabled: isRaiseCalculatorEnabled,
    };
  });

  return {
    tools: toolsWithFlags,
  };
};

/**
 * Cria adapter da API de ferramentas.
 * @param http Cliente HTTP com método GET.
 * @returns API de catálogo de ferramentas.
 */
export const createToolsApi = (http: HttpAdapter): ToolsApi => {
  return {
    getCatalog: async (): Promise<ToolsCatalog> => {
      const response = await http.get<ToolsCatalog>("/tools/catalog");
      return response.data;
    },
  };
};

/**
 * Query de catálogo de ferramentas.
 * @returns Query com catálogo e fallback de placeholder.
 */
export const useToolsCatalogQuery = (): UseQueryReturnType<ToolsCatalog, Error> => {
  const toolsApi = createToolsApi(useHttp());

  return useQuery({
    queryKey: ["tools", "catalog"],
    queryFn: async (): Promise<ToolsCatalog> => {
      try {
        const remoteCatalog = await toolsApi.getCatalog();
        return applyToolsFlags(remoteCatalog);
      } catch {
        return applyToolsFlags(toolsPlaceholder);
      }
    },
  });
};
