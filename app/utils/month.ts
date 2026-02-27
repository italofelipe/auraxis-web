const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/**
 * Formata mês ISO (`YYYY-MM`) para exibição legível.
 * @param isoMonth Mês no formato ISO curto.
 * @returns Mês formatado em pt-BR.
 */
export const formatMonth = (isoMonth: string): string => {
  const parsed = new Date(`${isoMonth}-01T00:00:00.000Z`);
  return monthFormatter.format(parsed);
};
