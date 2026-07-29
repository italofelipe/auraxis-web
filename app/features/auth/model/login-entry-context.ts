/**
 * Contexto com que alguém chega ao login vindo de outra origem (#1243).
 *
 * O checkout vive no apex e o login no app: `sessionStorage` não atravessa
 * origens, então a informação vem por query string. Por isso nada aqui é texto
 * livre — o motivo é um valor fechado e o plano é validado contra a lista
 * vendável. Um link forjado não consegue escrever mensagem na tela de login
 * nem empurrar a pessoa para um destino arbitrário.
 */

/** Motivos reconhecidos na query `?motivo=`. */
export const LOGIN_ENTRY_REASONS = ["conta-existente"] as const;

export type LoginEntryReason = (typeof LOGIN_ENTRY_REASONS)[number];

/** Slugs de plano aceitos na query `?plano=`, espelhando o checkout da landing. */
const PLAN_SLUGS = ["mensal", "anual"] as const;

type PlanSlug = (typeof PLAN_SLUGS)[number];

export interface LoginEntryContext {
  /** Motivo reconhecido, ou null quando ausente/desconhecido. */
  reason: LoginEntryReason | null;
  /** Plano que a pessoa estava comprando, ou null. */
  planSlug: PlanSlug | null;
}

/**
 * Normaliza um valor de query que pode vir repetido (`?x=a&x=b`).
 *
 * @param raw - Valor cru vindo de `route.query`.
 * @returns Primeira string encontrada, ou null.
 */
const firstString = (raw: unknown): string | null => {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  return typeof candidate === "string" ? candidate.trim().toLowerCase() : null;
};

/**
 * Lê o contexto de entrada do login a partir da query.
 *
 * @param query - `route.query` da página de login.
 * @returns Motivo e plano reconhecidos; campos desconhecidos viram null.
 */
export const readLoginEntryContext = (
  query: Record<string, unknown>,
): LoginEntryContext => {
  const rawReason = firstString(query.motivo);
  const rawPlan = firstString(query.plano);
  return {
    reason: LOGIN_ENTRY_REASONS.includes(rawReason as LoginEntryReason)
      ? (rawReason as LoginEntryReason)
      : null,
    planSlug: PLAN_SLUGS.includes(rawPlan as PlanSlug) ? (rawPlan as PlanSlug) : null,
  };
};

/**
 * Mesma leitura, mas tolerando o descarte da query em página prerenderizada.
 *
 * O `/login` é SSG: ao hidratar, o Nuxt normaliza a rota e `route.query` chega
 * VAZIO — mesmo comportamento que obrigou o checkout a consultar a entrada de
 * navegação (#1203). Aqui a query é a única ponte entre o apex e o app, então
 * perdê-la significaria não exibir a mensagem nem retomar o plano.
 *
 * @param query - `route.query` (pode vir vazio).
 * @param urlSources - Outras fontes de URL, em ordem de preferência
 *   (`window.location.search`, URL da entrada de navegação).
 * @returns Contexto reconhecido na primeira fonte que tiver algo útil.
 */
export const readLoginEntryContextFromSources = (
  query: Record<string, unknown>,
  ...urlSources: (string | null | undefined)[]
): LoginEntryContext => {
  const fromRoute = readLoginEntryContext(query);
  if (fromRoute.reason) {
    return fromRoute;
  }
  for (const source of urlSources) {
    if (!source) {
      continue;
    }
    const search = source.includes("?") ? source.slice(source.indexOf("?")) : source;
    const params = new URLSearchParams(search);
    const fromUrl = readLoginEntryContext({
      motivo: params.get("motivo"),
      plano: params.get("plano"),
    });
    if (fromUrl.reason) {
      return fromUrl;
    }
  }
  return fromRoute;
};

/**
 * Destino pós-login para quem veio do checkout.
 *
 * Com plano reconhecido a pessoa volta para a assinatura em vez de cair no
 * dashboard — ela estava comprando, e perder isso é perder a venda.
 *
 * @param context - Contexto lido da query.
 * @returns Caminho interno do app, ou null quando não há retomada a fazer.
 */
export const resolvePostLoginDestination = (
  context: LoginEntryContext,
): string | null => {
  if (context.reason !== "conta-existente" || !context.planSlug) {
    return null;
  }
  return `/plans?plano=${context.planSlug}`;
};
