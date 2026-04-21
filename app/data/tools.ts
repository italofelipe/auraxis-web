/**
 * tools.ts — Build-time slug list for prerender + routeRules.
 *
 * Kept intentionally minimal: `nuxt.config.ts` is evaluated before the
 * `~/*` alias resolves, so it cannot import the richer catalog from
 * `~/features/tools/model/tools-catalog.ts`. This file exists only to
 * feed the slugs into `routeRules` and `nitro.prerender.routes`.
 *
 * The authoritative per-tool metadata (category, access level, feature
 * flag, description, etc.) lives in `app/features/tools/model/tools-catalog.ts`.
 * Keep this slug list in sync with `TOOLS_CATALOG[].id` entries — a CI
 * guard in `tools-catalog.spec.ts` asserts parity so drift fails loudly.
 */
export const TOOL_SLUGS: readonly string[] = [
  "aluguel-vs-compra",
  "aposentadoria",
  "cdb-lci-lca",
  "cet",
  "clt-vs-pj",
  "conversor-moeda",
  "custo-estilo-vida",
  "desconto-markup",
  "dividir-conta",
  "ferias",
  "fgts",
  "fii",
  "financiamento-imobiliario",
  "fire",
  "hora-extra",
  "inss-ir-folha",
  "installment-vs-cash",
  "juros-compostos",
  "mei",
  "orcamento-50-30-20",
  "quitacao-dividas",
  "rescisao",
  "reserva-emergencia",
  "salario-liquido",
  "tesouro-direto",
  "thirteenth-salary",
];
