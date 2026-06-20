/**
 * Formata um valor monetário de forma compacta (ex.: "R$ 12,3k", "R$ 980").
 * Usado em rótulos de gráficos e chips, onde o formato completo é longo demais.
 *
 * @param value Valor em reais.
 * @returns String compacta em pt-BR.
 */
export const formatCurrencyShort = (value: number): string => {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    const short = (value / 1000).toFixed(abs >= 10000 ? 0 : 1).replace(".", ",");
    return `R$ ${short}k`;
  }
  return `R$ ${Math.round(value)}`;
};

/**
 * Extrai "DD/MM" de uma data ISO (YYYY-MM-DD).
 *
 * @param isoDate Data ISO ou null.
 * @returns "DD/MM" ou "—" quando ausente/inválida.
 */
export const formatDayMonth = (isoDate: string | null | undefined): string => {
  if (!isoDate) {
    return "—";
  }
  const [, month, day] = isoDate.split("-");
  if (!month || !day) {
    return "—";
  }
  return `${day.slice(0, 2)}/${month}`;
};
