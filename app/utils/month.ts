const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/**
 * Formats an ISO month (`YYYY-MM`) for human-readable display.
 * @param isoMonth Month in short ISO format.
 * @returns Month formatted using the pt-BR locale.
 */
export const formatMonth = (isoMonth: string): string => {
  const parsed = new Date(`${isoMonth}-01T00:00:00.000Z`);
  return monthFormatter.format(parsed);
};
