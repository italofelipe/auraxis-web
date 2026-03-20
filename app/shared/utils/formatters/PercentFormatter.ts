/**
 * Formata percentual com sinal.
 * @param value - Valor percentual, ex: 12.5 para 12,50%.
 * @param decimals - Número de casas decimais (padrão: 2).
 * @returns String formatada com sinal, ex: "+12,50%".
 */
const format = (value: number, decimals = 2): string => {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals).replace(".", ",")}%`;
};

/**
 * Formata percentual sem sinal (para casos onde sinal é contextual).
 * @param value - Valor percentual, ex: -12.5.
 * @param decimals - Número de casas decimais (padrão: 2).
 * @returns String sem sinal, ex: "12,50%".
 */
const formatAbs = (value: number, decimals = 2): string =>
  `${Math.abs(value).toFixed(decimals).replace(".", ",")}%`;

/**
 * Converte decimal (0–1) para percentual.
 * @param value - Valor decimal entre 0 e 1, ex: 0.125.
 * @param decimals - Número de casas decimais (padrão: 2).
 * @returns String formatada com sinal, ex: "+12,50%".
 */
const fromDecimal = (value: number, decimals = 2): string =>
  format(value * 100, decimals);

/**
 * Formatador de valores percentuais no padrão brasileiro.
 */
export const PercentFormatter = { format, formatAbs, fromDecimal };
