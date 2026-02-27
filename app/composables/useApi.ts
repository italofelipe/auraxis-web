export interface HealthResponse {
  readonly status: string;
  readonly message?: string;
}

type ApiFetcher = <T>(request: string, options?: { method?: string }) => Promise<T>;
type RuntimeConfigReader = () => { public?: { apiBase?: string | null } };

/**
 * Remove barras ao final de uma URL base para evitar concatenação inválida de rota.
 * @param rawUrl URL de entrada.
 * @returns URL sem barras de sufixo.
 */
export const removeTrailingSlashes = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

export interface WebApiClient {
  getBaseUrl(): string;
  checkHealth(): Promise<HealthResponse>;
}

/**
 * Cria cliente HTTP mínimo para healthcheck e resolução de base URL.
 * @param fetcher Função de request.
 * @param baseUrl URL base da API.
 * @returns Cliente de API web.
 */
export const createApiClient = (
  fetcher: ApiFetcher,
  baseUrl: string,
): WebApiClient => {
  const normalizedBaseUrl = removeTrailingSlashes(baseUrl);

  return {
    getBaseUrl: (): string => normalizedBaseUrl,
    checkHealth: async (): Promise<HealthResponse> => {
      return fetcher<HealthResponse>(`${normalizedBaseUrl}/health`, {
        method: "GET",
      });
    },
  };
};

/**
 * Resolve configuração de runtime e instancia cliente de API.
 * @param readRuntimeConfig Leitor de runtime config (injetável para teste).
 * @param fetcher Função de request (injetável para teste).
 * @returns Cliente de API com base normalizada.
 */
export const useApi = (
  readRuntimeConfig: RuntimeConfigReader = useRuntimeConfig,
  fetcher: ApiFetcher = $fetch as ApiFetcher,
): WebApiClient => {
  const runtimeConfig = readRuntimeConfig();
  const baseUrl = String(runtimeConfig.public?.apiBase ?? "http://localhost:5000");

  return createApiClient(fetcher, baseUrl);
};
