// Carregador único do SDK do PostHog.
//
// Por que existe: o `import` estático nos dois plugins colocava a biblioteca
// inteira no chunk de entrada — 62 marcadores `posthog` dentro dos 321 KB da
// home, baixados inclusive por quem recusa cookies (#1246). Com o import
// dinâmico aqui, o SDK vira chunk separado e só desce quando há consentimento.
//
// Por que num módulo compartilhado e não um `import()` em cada arquivo:
// `posthog-js/dist/module.no-external` é uma instância de módulo distinta de
// `posthog-js` (#1209). Dois entrypoints diferentes criariam dois singletons
// desconectados — o web-vitals reportaria para um cliente nunca inicializado.
// Concentrar o especificador num lugar torna isso impossível de errar, e a
// promise memoizada garante uma única inicialização mesmo com chamadas
// concorrentes.
//
// `import type` não emite código em runtime — o tipo vem do pacote sem
// arrastá-lo de volta para o bundle.
import type posthogSdk from "posthog-js/dist/module.no-external";

/** Tipo do singleton exportado pelo build `no-external` do posthog-js. */
export type PostHogSdk = typeof posthogSdk;

let sdkPromise: Promise<PostHogSdk> | null = null;

/**
 * Carrega (uma única vez) o SDK do PostHog e devolve o singleton.
 *
 * Chamar mais de uma vez devolve sempre a mesma promise, então a ordem das
 * continuações é a ordem das chamadas — é isso que impede o funil da landing
 * de perder eventos disparados entre o aceite e o módulo chegar (#1208).
 *
 * @returns Promise resolvida com o singleton do posthog-js.
 */
export function loadPostHogSdk(): Promise<PostHogSdk> {
  sdkPromise ??= import("posthog-js/dist/module.no-external").then(
    (module) => module.default,
  );
  return sdkPromise;
}

/**
 * Indica se o SDK já foi solicitado nesta sessão.
 *
 * Útil para caminhos que não devem *provocar* o download — desligar o
 * consentimento de quem nunca carregou o SDK não pode baixá-lo só para chamar
 * `opt_out_capturing`.
 *
 * @returns `true` quando `loadPostHogSdk` já foi chamado.
 */
export function isPostHogSdkRequested(): boolean {
  return sdkPromise !== null;
}

/**
 * Descarta a promise memoizada. Existe para testes e hot reload.
 */
export function resetPostHogSdkLoader(): void {
  sdkPromise = null;
}
