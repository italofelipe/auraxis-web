import * as Sentry from "@sentry/vue";

/**
 * Inicializa observabilidade mínima no cliente para o canal web oficial.
 * Mantém o plugin inerte quando o DSN não estiver configurado.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig();
  const dsn = String(runtimeConfig.public.sentryDsn ?? "").trim();

  if (!dsn) {
    return;
  }

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    environment: String(runtimeConfig.public.appEnv ?? "production"),
    enabled: true,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
});
