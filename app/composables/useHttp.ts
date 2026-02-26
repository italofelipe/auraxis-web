import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export const normalizeBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

const createAuthInterceptor =
  (getAccessToken: () => string | null) =>
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };

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

export const useHttp = (): AxiosInstance => {
  const runtimeConfig = useRuntimeConfig();
  const sessionStore = useSessionStore();
  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);

  return createHttpClient(apiBase, () => sessionStore.accessToken);
};
