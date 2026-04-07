/**
 * Formats an ISO month (`YYYY-MM`) for human-readable display.
 *
 * @param isoMonth ISO month string (`YYYY-MM`).
 * @param locale   BCP 47 locale string (default `"pt-BR"`).
 * @returns Month formatted using the given locale, e.g. `"março de 2026"`.
 */
export const formatMonth = (isoMonth: string, locale = "pt-BR"): string => {
  const parsed = new Date(`${isoMonth}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(parsed);
};
