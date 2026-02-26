import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

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

  return {
    provide: {
      queryClient,
    },
  };
});
