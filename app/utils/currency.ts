const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number): string => {
  return currencyFormatter.format(value);
};
