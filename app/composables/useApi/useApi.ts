export interface HealthResponse {
  readonly status: string;
  readonly message?: string;
}

type ApiFetcher = <T>(request: string, options?: { method?: string }) => Promise<T>;
type RuntimeConfigReader = () => { public?: { apiBase?: string | null } };

/**
 * Strips trailing slashes from a base URL to avoid invalid route concatenation.
 * @param rawUrl Input URL.
 * @returns URL without trailing slashes.
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
 * Creates a minimal HTTP client for healthcheck and base URL resolution.
 * @param fetcher Request function.
 * @param baseUrl API base URL.
 * @returns Web API client.
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
 * Resolves runtime configuration and instantiates the API client.
 * @param readRuntimeConfig Runtime config reader (injectable for testing).
 * @param fetcher Request function (injectable for testing).
 * @returns API client with normalized base URL.
 */
export const useApi = (
  readRuntimeConfig: RuntimeConfigReader = useRuntimeConfig,
  fetcher: ApiFetcher = $fetch as ApiFetcher,
): WebApiClient => {
  const runtimeConfig = readRuntimeConfig();
  const baseUrl = String(runtimeConfig.public?.apiBase ?? "http://localhost:5000");

  return createApiClient(fetcher, baseUrl);
};
