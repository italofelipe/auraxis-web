/**
 * @module calculations/utility
 *
 * Pure financial utility calculation functions.
 *
 * Covers:
 * - Bill splitting (dividir conta) — equal split or proportional by consumption
 * - Discount / Markup / Margin — four modes: desconto, markup, margem, reverso
 * - Currency converter (conversor moeda) — 9 currency pairs via BRAPI bid/ask
 * - Installment vs Cash (parcelado vs à vista) — present value comparison
 *   PV = Σ PMT_i / (1+r)^i  (discounted at opportunity rate)
 *
 * All functions are pure: no side effects, no Vue reactivity.
 * Source of truth for WEB36 unit tests.
 */

export * from "~/features/tools/model/dividir-conta";
export * from "~/features/tools/model/desconto-markup";
export * from "~/features/tools/model/conversor-moeda";
export * from "~/features/tools/model/installment-vs-cash";
