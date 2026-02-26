const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export const formatMonth = (isoMonth: string): string => {
  const parsed = new Date(`${isoMonth}-01T00:00:00.000Z`);
  return monthFormatter.format(parsed);
};
