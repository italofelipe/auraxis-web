import { useRuntimeConfig } from "#app";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";

import type { ToolsCatalog } from "~/types/contracts";
import { useHttp } from "~/composables/useHttp";
import { isFeatureEnabled, resolveProviderDecision } from "~/shared/feature-flags";

/**
 * Mock data for local development / controlled test environments.
 * Only active when NUXT_PUBLIC_MOCK_DATA=true — never in the nominal
 * production path (WEB-CONTRACT-01).
 */
const toolsMock: ToolsCatalog = {
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

/**
 * Returns true when explicit mock mode is enabled via env var.
 * Must never be true in production.
 * @returns True when NUXT_PUBLIC_MOCK_DATA=true.
 */
const isMockDataEnabled = (): boolean => {
  const config = useRuntimeConfig();
  return (config.public as Record<string, unknown>).mockData === "true";
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
export const applyToolsFlags = async (catalog: ToolsCatalog): Promise<ToolsCatalog> => {
  const toolsWithFlagsPromises = catalog.tools.map(async (tool): Promise<ToolsCatalog["tools"][number]> => {
    if (tool.id !== "raise-calculator") {
      return tool;
    }

    const flagKey = "web.tools.salary-raise-calculator";
    const providerDecision = await resolveProviderDecision(flagKey);
    const isRaiseCalculatorEnabled = isFeatureEnabled(flagKey, providerDecision);
    return {
      ...tool,
      enabled: isRaiseCalculatorEnabled,
    };
  });
  const toolsWithFlags = await Promise.all(toolsWithFlagsPromises);

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
 *
 * Falhas de contrato são propagadas como estado de erro do Vue Query para
 * que a UI possa exibir feedback rastreável.  Mock data só é usado quando
 * NUXT_PUBLIC_MOCK_DATA=true (dev/teste explícito) — jamais no fluxo nominal.
 *
 * @returns Query com estado de loading, error e data tipados.
 */
export const useToolsCatalogQuery = (): UseQueryReturnType<ToolsCatalog, Error> => {
  const toolsApi = createToolsApi(useHttp());

  return useQuery({
    queryKey: ["tools", "catalog"],
    queryFn: async (): Promise<ToolsCatalog> => {
      if (isMockDataEnabled()) {
        return await applyToolsFlags(toolsMock);
      }
      const remoteCatalog = await toolsApi.getCatalog();
      return await applyToolsFlags(remoteCatalog);
    },
  });
};
