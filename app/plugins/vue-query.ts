import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

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
        retry: 1,
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
