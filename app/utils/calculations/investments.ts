/**
 * @module calculations/investments
 *
 * Pure financial calculation functions for Brazilian investment products.
 *
 * Covers:
 * - Compound interest (juros compostos) — FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r
 * - CDB / LCI / LCA — IR regressive table (Lei 11.033/2004), CDI-linked returns
 * - Tesouro Direto — Selic, IPCA+, Prefixado; B3 custody fee 0.20% p.a.
 * - FII (Fundos de Investimento Imobiliário) — Dividend Yield, Yield on Cost
 *   via BRAPI live quotes
 *
 * All functions are pure: no side effects, no Vue reactivity.
 * Source of truth for WEB36 unit tests.
 */

/* v8 ignore start */
export * from "~/features/tools/model/juros-compostos";
export * from "~/features/tools/model/cdb-lci-lca";
export * from "~/features/tools/model/tesouro-direto";
export * from "~/features/tools/model/fii";
/* v8 ignore stop */
