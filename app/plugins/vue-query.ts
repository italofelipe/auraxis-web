import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

/**
 * Exponential back-off for Vue Query retries (mirrors axios-retry logic).
 *
 * Auth queries must opt out with `{ retry: false }` at the call site because
 * a 401 from `/auth/login` is a legitimate rejection, not a transient failure.
 *
 * @param attemptIndex Zero-based retry attempt index.
 * @returns Delay in milliseconds, capped at 10 000 ms.
 */
const queryRetryDelay = (attemptIndex: number): number =>
  Math.min(1_000 * 2 ** attemptIndex, 10_000);

/**
 * Instantiates a QueryClient with conservative defaults for server state.
 * @returns QueryClient configured for the application.
 */
const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        retry: 2,
        retryDelay: queryRetryDelay,
        refetchOnWindowFocus: false,
      },
    },
  });
};

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = createQueryClient();

  nuxtApp.vueApp.use(VueQueryPlugin, {
    queryClient,
  });
});
