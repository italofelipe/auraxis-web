import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

/**
 * Remove barras ao final da URL base para evitar `//` na montagem de endpoints.
 * @param rawUrl URL base de entrada.
 * @returns URL normalizada.
 */
export const normalizeBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

/**
 * Cria interceptor de autenticação bearer para requests Axios.
 * @param getAccessToken Função para leitura do token atual.
 * @returns Interceptor de request.
 */
const createAuthInterceptor = (
  getAccessToken: () => string | null,
): ((config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig) => {
  /**
   * Injeta header Authorization quando existir token.
   * @param config Configuração de request.
   * @returns Configuração enriquecida com token.
   */
  const applyAuthHeader = (
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  };

  return applyAuthHeader;
};

/**
 * Cria cliente HTTP configurado para API Auraxis.
 * @param baseUrl URL base de API.
 * @param getAccessToken Função para leitura do token atual.
 * @returns Instância Axios configurada.
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

/**
 * Resolve config de runtime e instancia cliente HTTP da aplicação.
 * @returns Cliente HTTP com interceptor de sessão.
 */
export const useHttp = (): AxiosInstance => {
  const runtimeConfig = useRuntimeConfig();
  const sessionStore = useSessionStore();
  const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);

  return createHttpClient(apiBase, () => sessionStore.accessToken);
};
