export interface HealthResponse {
  readonly status: string;
  readonly message?: string;
}

type ApiFetcher = <T>(request: string, options?: { method?: string }) => Promise<T>;

const normalizeBaseUrl = (rawUrl: string): string => rawUrl.replace(/\/+$/, "");

const normalizePath = (path: string): string => {
  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
};

export interface WebApiClient {
  getBaseUrl(): string;
  checkHealth(): Promise<HealthResponse>;
}

export const createApiClient = (fetcher: ApiFetcher, baseUrl: string): WebApiClient => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    getBaseUrl: (): string => normalizedBaseUrl,
    checkHealth: async (): Promise<HealthResponse> => {
      const requestUrl = `${normalizedBaseUrl}${normalizePath("/health")}`;
      return fetcher<HealthResponse>(requestUrl, { method: "GET" });
    },
  };
};

export const useApi = (): WebApiClient => {
  const runtimeConfig = useRuntimeConfig();
  const baseUrl = String(runtimeConfig.public.apiBase ?? "http://localhost:5000");

  return createApiClient($fetch, baseUrl);
};
