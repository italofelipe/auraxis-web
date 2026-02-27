const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

/**
 * Formata valor monetário em Real (pt-BR).
 * @param value Valor numérico em BRL.
 * @returns String formatada para exibição.
 */
export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};
