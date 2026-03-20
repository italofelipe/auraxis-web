const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_CURRENCY = "BRL";

/**
 * Formata valor como moeda BRL.
 * @param value - Valor numérico a formatar.
 * @param currency - Código ISO da moeda (padrão: BRL).
 * @returns String formatada, ex: "R$ 1.234,56".
 */
const format = (value: number, currency = DEFAULT_CURRENCY): string =>
  new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/**
 * Formata como moeda compacta (K/mi).
 * @param value - Valor numérico a formatar.
 * @returns String compacta, ex: "R$ 1,5 mi".
 */
const formatCompact = (value: number): string =>
  new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

/**
 * Remove formatação e retorna número puro.
 * @param formatted - String monetária formatada, ex: "R$ 1.234,56".
 * @returns Número puro, ex: 1234.56.
 */
const parse = (formatted: string): number => {
  const cleaned = formatted
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned);
};

/**
 * Formatador de valores monetários no padrão BRL.
 * Princípio: puro, sem side effects, 100% testável.
 */
export const CurrencyFormatter = { format, formatCompact, parse };
