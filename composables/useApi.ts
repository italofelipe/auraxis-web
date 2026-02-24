export interface HealthResponse {
  readonly status: string;
  readonly message?: string;
}

type ApiFetcher = <T>(request: string, options?: { method?: string }) => Promise<T>;
type RuntimeConfigReader = () => { public?: { apiBase?: string | null } };

const removeTrailingSlashes = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.charCodeAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

export interface WebApiClient {
  getBaseUrl(): string;
  checkHealth(): Promise<HealthResponse>;
}

export const createApiClient = (fetcher: ApiFetcher, baseUrl: string): WebApiClient => {
  const normalizedBaseUrl = removeTrailingSlashes(baseUrl);

  return {
    getBaseUrl: (): string => normalizedBaseUrl,
    checkHealth: async (): Promise<HealthResponse> => {
      const requestUrl = `${normalizedBaseUrl}/health`;
      return fetcher<HealthResponse>(requestUrl, { method: "GET" });
    },
  };
};

export const useApi = (
  readRuntimeConfig: RuntimeConfigReader = useRuntimeConfig,
  fetcher: ApiFetcher = $fetch as ApiFetcher,
): WebApiClient => {
  const runtimeConfig = readRuntimeConfig();
  const baseUrl = String(runtimeConfig.public?.apiBase ?? "http://localhost:5000");

  return createApiClient(fetcher, baseUrl);
};
