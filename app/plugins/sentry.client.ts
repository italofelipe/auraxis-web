import * as Sentry from "@sentry/nuxt";

/**
 * Normaliza o DSN: retorna a string sem espaços ou vazio se ausente.
 *
 * @param raw - Valor bruto do DSN vindo do runtimeConfig.
 * @returns DSN normalizado.
 */
export function normalizeDsn(raw: unknown): string {
  return String(raw ?? "").trim();
}

/**
 * Inicializa o Sentry com DSN e ambiente.
 * Exportada separadamente para facilitar testes unitários.
 *
 * @param dsn - Data Source Name do projeto Sentry.
 * @param environment - Ambiente de execução (production, staging, development).
 */
export function initSentry(dsn: string, environment: string): void {
  Sentry.init({
    dsn,
    environment,
    enabled: true,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

/**
 * Plugin Nuxt para inicialização do Sentry no cliente.
 * Mantém o plugin inerte quando o DSN não estiver configurado (opt-in).
 * A integração Vue é gerenciada automaticamente pelo @sentry/nuxt/module.
 *
 * Note: the plugin body relies on Nuxt runtime (useRuntimeConfig / defineNuxtPlugin)
 * and is excluded from unit-test coverage — covered by e2e/integration tests.
 */
/* v8 ignore start */
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const dsn = normalizeDsn(runtimeConfig.public.sentryDsn);

  if (!dsn) {
    return;
  }

  const environment = normalizeDsn(runtimeConfig.public.appEnv) || "production";
  initSentry(dsn, environment);
});
/* v8 ignore stop */
