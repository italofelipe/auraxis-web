import { formatCurrency } from "~/utils/currency";

/**
 * Preview de parcelamento exibido no QuickTransactionForm (tx-1 / #866).
 */
export interface InstallmentPreview {
  /** Valor por parcela formatado em BRL (ex.: "R$ 100,00"). */
  readonly perInstallment: string;
  /** Data da 1ª parcela em DD/MM/YYYY. */
  readonly firstDate: string;
  /** Data da última parcela em DD/MM/YYYY. */
  readonly lastDate: string;
  /** Total de parcelas. */
  readonly totalCount: number;
}

/**
 * Soma meses a uma data, clampando o dia ao último dia do mês de destino
 * (evita rollover de 31/01 + 1 mês → 03/03).
 *
 * @param date Data base.
 * @param months Meses a somar.
 * @returns Nova data deslocada.
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date.getTime());
  const targetMonth = result.getMonth() + months;
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(targetMonth);
  const lastDayOfMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(day, lastDayOfMonth));
  return result;
};

/**
 * Formata uma data em DD/MM/YYYY (pt-BR).
 *
 * @param date Data a formatar.
 * @returns String DD/MM/YYYY.
 */
const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

/**
 * Calcula o preview do parcelamento (valor por parcela + janela de datas).
 *
 * O `amount` é o **total** da compra (o backend divide em N parcelas). A última
 * parcela vence `count - 1` meses após a primeira.
 *
 * @param amount Valor total da transação.
 * @param count Número de parcelas (>= 2).
 * @param firstDueDate Vencimento da primeira parcela.
 * @returns Preview formatado.
 */
export const previewInstallments = (
  amount: number,
  count: number,
  firstDueDate: Date,
): InstallmentPreview => {
  const safeCount = Math.max(1, Math.floor(count));
  const perInstallment = amount / safeCount;
  return {
    perInstallment: formatCurrency(perInstallment),
    firstDate: formatDate(firstDueDate),
    lastDate: formatDate(addMonths(firstDueDate, safeCount - 1)),
    totalCount: safeCount,
  };
};
