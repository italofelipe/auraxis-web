import { useQuery } from "@tanstack/vue-query";

import type { ToolsCatalog } from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";

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

export const createToolsApi = (http: HttpAdapter) => {
  return {
    getCatalog: async (): Promise<ToolsCatalog> => {
      const response = await http.get<ToolsCatalog>("/tools/catalog");
      return response.data;
    },
  };
};

export const useToolsCatalogQuery = () => {
  const toolsApi = createToolsApi(useHttp());

  return useQuery({
    queryKey: ["tools", "catalog"],
    queryFn: async (): Promise<ToolsCatalog> => {
      try {
        return await toolsApi.getCatalog();
      } catch {
        return toolsPlaceholder;
      }
    },
  });
};
