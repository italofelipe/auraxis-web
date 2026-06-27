import type { CreditCardDto } from "../contracts/credit-card.dto";
import { resolveCardCycleForMonth } from "../utils/transaction-billing";

/**
 * Deriva a `due_date` (YYYY-MM-DD) para que uma despesa caia na fatura do mês de
 * competência informado, dado o ciclo do cartão.
 *
 * O usuário escolhe diretamente o "mês da fatura"; a data de vencimento é
 * secundária e derivada do ciclo. Usa o `closingDate` do ciclo do mês (que, por
 * construção de `resolveCardCycleForMonth`, sempre cai no mês de competência),
 * garantindo que `billMonth(due_date) === competenceMonth`. Para parceladas, o
 * backend incrementa +1 mês a cada parcela a partir dessa data, distribuindo-as
 * nos meses subsequentes.
 *
 * Sem ciclo (cartão sem `closing_day`/`due_day`, ou nenhum cartão), usa o dia 1
 * do mês — transações sem cartão agrupam pelo mês-calendário da `due_date`.
 *
 * @param card Cartão (ou null) com o ciclo de fechamento/vencimento.
 * @param competenceMonth Mês da fatura desejado (YYYY-MM).
 * @returns Data de vencimento (YYYY-MM-DD) que cai na fatura do mês informado.
 */
export const dueDateForBillMonth = (
  card: Pick<CreditCardDto, "closing_day" | "due_day"> | null,
  competenceMonth: string,
): string => {
  const hasCycle =
    typeof card?.closing_day === "number" && typeof card?.due_day === "number";
  const cycle = hasCycle ? resolveCardCycleForMonth(card, competenceMonth) : null;
  if (cycle) {
    return cycle.closingDate;
  }
  return `${competenceMonth}-01`;
};
