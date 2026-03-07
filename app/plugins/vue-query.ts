import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

/**
 * Instancia QueryClient com defaults conservadores para server-state.
 * @returns QueryClient configurado para a aplicação.
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
