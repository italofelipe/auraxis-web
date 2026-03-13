import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * Removes trailing slashes from a base URL to avoid duplicated separators.
 *
 * @param rawUrl Candidate base URL.
 * @returns Normalized base URL.
 */
export const normalizeBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

/**
 * Creates an authorization interceptor that injects a bearer token when available.
 *
 * @param getAccessToken Lazy token resolver.
 * @returns Axios request interceptor.
 */
const createAuthInterceptor = (
  getAccessToken: () => string | null,
): ((config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) => {
  return (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };
};

/**
 * Creates the canonical Auraxis HTTP client with auth interception.
 *
 * @param baseUrl API base URL.
 * @param getAccessToken Lazy token resolver.
 * @returns Configured Axios client.
 */
export const createHttpClient = (
  baseUrl: string,
  getAccessToken: () => string | null,
): AxiosInstance => {
  const client = axios.create({
    baseURL: normalizeBaseUrl(baseUrl),
    timeout: 15_000,
  });

  client.interceptors.request.use(createAuthInterceptor(getAccessToken));
  return client;
};
