import type { FetchOptions } from "ofetch";

import { useSessionStore } from "~/stores/session";
import { ApiError } from "~/utils/apiError";

const DEFAULT_API_BASE = "http://localhost:3333";

/**
 * Removes trailing slashes from a URL so path concatenation never duplicates separators.
 * @param rawUrl Candidate base URL.
 * @returns URL without trailing slashes.
 */
export const normalizeHttpClientBaseUrl = (rawUrl: string): string => {
  let end = rawUrl.length;

  while (end > 0 && rawUrl.codePointAt(end - 1) === 47) {
    end -= 1;
  }

  return rawUrl.slice(0, end);
};

type FetcherFn = <T>(url: string, opts?: FetchOptions) => Promise<T>;
type RuntimeConfigReader = () => { public?: { apiBase?: string | null } };
type TokenProvider = () => string | null;
type LogoutHandler = () => Promise<void>;
type NavigateHandler = (path: string) => Promise<void>;

export interface HttpClientMethods {
  get<T>(path: string, opts?: FetchOptions): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: FetchOptions): Promise<T>;
  put<T>(path: string, body?: unknown, opts?: FetchOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, opts?: FetchOptions): Promise<T>;
  del<T>(path: string, opts?: FetchOptions): Promise<T>;
}

export interface HttpClientDeps {
  fetcher?: FetcherFn;
  readRuntimeConfig?: RuntimeConfigReader;
  getToken?: TokenProvider;
  onLogout?: LogoutHandler;
  onNavigate?: NavigateHandler;
}

interface RequestContext {
  fetcher: FetcherFn;
  getToken: TokenProvider;
  onLogout: LogoutHandler;
  onNavigate: NavigateHandler;
}

/**
 * Builds the Authorization header value when a token is available.
 * @param token JWT access token or null.
 * @returns Header value string or undefined when no token exists.
 */
const buildAuthHeader = (token: string | null): string | undefined => {
  return token ? `Bearer ${token}` : undefined;
};

/**
 * Normalises a raw fetch error into a typed ApiError.
 * @param error Unknown error thrown by the fetcher.
 * @returns Typed ApiError with status and message.
 */
const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error !== null && typeof error === "object" && "status" in error) {
    const fetchErr = error as { status: number; message?: string; data?: { code?: string } };
    const status = typeof fetchErr.status === "number" ? fetchErr.status : 500;
    const message = fetchErr.message ?? "Unexpected error";
    const code = fetchErr.data?.code;
    return new ApiError(status, message, code);
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return new ApiError(500, message);
};

/**
 * Executes a fetch call, injecting auth headers and normalising errors.
 * Handles 401 responses by triggering logout and redirect to /login.
 * @param ctx Request context with fetcher and side-effect handlers.
 * @param url Full request URL.
 * @param opts ofetch options.
 * @returns Typed response body.
 */
const executeRequest = async <T>(
  ctx: RequestContext,
  url: string,
  opts: FetchOptions,
): Promise<T> => {
  const token = ctx.getToken();
  const authHeader = buildAuthHeader(token);

  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  try {
    return await ctx.fetcher<T>(url, { ...opts, headers });
  }
  catch (error: unknown) {
    const apiError = toApiError(error);

    if (apiError.status === 401) {
      await ctx.onLogout();
      await ctx.onNavigate("/login");
    }

    throw apiError;
  }
};

interface HttpClientFactoryParams {
  baseUrl: string;
  ctx: RequestContext;
}

/**
 * Creates typed HTTP client methods bound to a fixed base URL and request context.
 * @param params Base URL and request context with auth and error handlers.
 * @returns HTTP methods: get, post, put, patch, del.
 */
export const createHttpClientMethods = (params: HttpClientFactoryParams): HttpClientMethods => {
  const { baseUrl, ctx } = params;

  /**
   * Dispatches a request to the given path using the shared request context.
   * @param path API path relative to the base URL.
   * @param opts ofetch options including method and body.
   * @returns Typed response body.
   */
  const request = <T>(path: string, opts: FetchOptions): Promise<T> =>
    executeRequest<T>(ctx, `${baseUrl}${path}`, opts);

  return {
    get: <T>(path: string, opts: FetchOptions = {}): Promise<T> =>
      request<T>(path, { ...opts, method: "GET" }),

    post: <T>(path: string, body?: unknown, opts: FetchOptions = {}): Promise<T> =>
      request<T>(path, { ...opts, method: "POST", body: body as FetchOptions["body"] }),

    put: <T>(path: string, body?: unknown, opts: FetchOptions = {}): Promise<T> =>
      request<T>(path, { ...opts, method: "PUT", body: body as FetchOptions["body"] }),

    patch: <T>(path: string, body?: unknown, opts: FetchOptions = {}): Promise<T> =>
      request<T>(path, { ...opts, method: "PATCH", body: body as FetchOptions["body"] }),

    del: <T>(path: string, opts: FetchOptions = {}): Promise<T> =>
      request<T>(path, { ...opts, method: "DELETE" }),
  };
};

/**
 * Centralized HTTP client composable with auth injection and error normalisation.
 *
 * - Reads base URL from `runtimeConfig.public.apiBase`.
 * - Injects JWT Bearer token from the session store on every request.
 * - On 401: calls `sessionStore.signOut()` and redirects to `/login`.
 * - All non-2xx errors are normalised into a typed `ApiError`.
 *
 * @param deps Optional dependency overrides for unit testing.
 * @returns Typed HTTP methods: `get`, `post`, `put`, `patch`, `del`.
 */
export const useHttpClient = (deps: HttpClientDeps = {}): HttpClientMethods => {
  const readConfig = deps.readRuntimeConfig ?? useRuntimeConfig;
  const runtimeConfig = readConfig();
  const rawBase = String(runtimeConfig.public?.apiBase ?? DEFAULT_API_BASE);
  const baseUrl = normalizeHttpClientBaseUrl(rawBase);

  const sessionStore = useSessionStore();

  const getToken: TokenProvider = deps.getToken ?? ((): string | null => sessionStore.getAccessToken());

  const onLogout: LogoutHandler = deps.onLogout ?? (async (): Promise<void> => {
    sessionStore.signOut();
  });

  const onNavigate: NavigateHandler = deps.onNavigate ?? (async (path: string): Promise<void> => {
    await navigateTo(path);
  });

  const fetcher: FetcherFn = deps.fetcher ?? ((<T>(url: string, opts?: FetchOptions): Promise<T> =>
    $fetch<T>(url, opts as Parameters<typeof $fetch>[1]) as Promise<T>) as FetcherFn);

  return createHttpClientMethods({
    baseUrl,
    ctx: { fetcher, getToken, onLogout, onNavigate },
  });
};
