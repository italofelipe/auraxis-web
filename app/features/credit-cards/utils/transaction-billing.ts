import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import type { CreditCardDto } from "../contracts/credit-card.dto";
import { type BillingCyclePreview, resolveCreditCardBillingCycle } from "./billing-cycle";

/** Nomes de meses em português (índice 0 = janeiro). */
const MONTH_LABELS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
] as const;

/** Abreviações de meses em português. */
const MONTH_ABBR_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
] as const;

/**
 * Transação de cartão enriquecida com o mês de fatura (billMonth) e o valor já
 * coagido para number. Forma de domínio consumida pelas agregações e views.
 */
export interface EnrichedTransaction {
  readonly id: string;
  readonly title: string;
  readonly amount: number;
  /** Data da compra (YYYY-MM-DD). */
  readonly purchaseDate: string;
  readonly tagId: string | null;
  readonly creditCardId: string | null;
  /** Mês da fatura em que a compra cai (YYYY-MM); null se o cartão não tem ciclo. */
  readonly billMonth: string | null;
  readonly isInstallment: boolean;
  readonly installmentCount: number | null;
  readonly installmentGroupId: string | null;
  readonly status: string;
}

/**
 * Coage uma string Decimal para number (0 quando inválida).
 *
 * @param value String monetária.
 * @returns Número finito.
 */
const toAmount = (value: string): number => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Enriquece transações de cartão com o mês de fatura, derivado do ciclo do cartão.
 *
 * Transações sem `credit_card_id` são descartadas (a área de Cartões só lida com
 * despesas de cartão). Quando o cartão não tem `closing_day`/`due_day`, o
 * `billMonth` fica null (não é possível resolver o ciclo).
 *
 * @param transactions Transações cruas do backend.
 * @param cards Cartões do usuário (para resolver o ciclo).
 * @returns Transações de cartão enriquecidas.
 */
export const enrichCardTransactions = (
  transactions: readonly TransactionDto[],
  cards: readonly CreditCardDto[],
): EnrichedTransaction[] => {
  const cardById = new Map(cards.map((card) => [card.id, card]));

  return transactions
    .filter((tx) => tx.credit_card_id !== null)
    .map((tx) => {
      const card = tx.credit_card_id ? cardById.get(tx.credit_card_id) ?? null : null;
      let billMonth: string | null = null;

      if (card && card.closing_day !== null && card.due_day !== null) {
        billMonth = resolveCreditCardBillingCycle({
          purchaseDate: tx.due_date,
          closingDay: card.closing_day,
          dueDay: card.due_day,
        }).billMonth;
      }

      return {
        id: tx.id,
        title: tx.title,
        amount: toAmount(tx.amount),
        purchaseDate: tx.due_date,
        tagId: tx.tag_id,
        creditCardId: tx.credit_card_id,
        billMonth,
        isInstallment: tx.is_installment,
        installmentCount: tx.installment_count,
        installmentGroupId: tx.installment_group_id,
        status: tx.status,
      };
    });
};

/**
 * Divide uma chave de mês (YYYY-MM) em ano e índice de mês (0-based).
 *
 * @param month Chave YYYY-MM.
 * @returns Tupla [ano, índiceDoMês].
 */
const parseMonthKey = (month: string): [number, number] => {
  const [year, monthNumber] = month.split("-").map(Number);
  return [year ?? 1970, (monthNumber ?? 1) - 1];
};

/**
 * Formata ano + índice de mês como chave YYYY-MM.
 *
 * @param year Ano.
 * @param monthIndex Índice 0-based do mês.
 * @returns Chave YYYY-MM normalizada.
 */
const formatMonthKey = (year: number, monthIndex: number): string => {
  const date = new Date(year, monthIndex, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Gera a janela crescente de N meses de fatura terminando em `endMonth`.
 *
 * @param endMonth Mês final (YYYY-MM), incluído na janela.
 * @param count Quantidade de meses (>= 1).
 * @returns Lista de chaves YYYY-MM, da mais antiga para a mais recente.
 */
export const billMonthsWindow = (endMonth: string, count: number): string[] => {
  const [year, monthIndex] = parseMonthKey(endMonth);
  const total = Math.max(1, count);
  const months: string[] = [];
  for (let offset = total - 1; offset >= 0; offset--) {
    months.push(formatMonthKey(year, monthIndex - offset));
  }
  return months;
};

/**
 * Primeiro dia (YYYY-MM-DD) da janela de N meses terminando em `endMonth`, com
 * uma folga de 1 mês para cobrir compras que caem na fatura do mês mais antigo.
 *
 * @param endMonth Mês final (YYYY-MM).
 * @param count Quantidade de meses da janela.
 * @returns Data inicial YYYY-MM-DD para filtrar transações.
 */
export const billWindowStartDate = (endMonth: string, count: number): string => {
  const [year, monthIndex] = parseMonthKey(endMonth);
  const date = new Date(year, monthIndex - Math.max(1, count), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
};

/**
 * Último dia (YYYY-MM-DD) de um mês.
 *
 * @param month Mês (YYYY-MM).
 * @returns Data final YYYY-MM-DD.
 */
export const monthEndDate = (month: string): string => {
  const [year, monthIndex] = parseMonthKey(month);
  const last = new Date(year, monthIndex + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
};

/**
 * Desloca uma chave de mês (YYYY-MM) por um número de meses.
 *
 * @param month Mês base (YYYY-MM).
 * @param delta Deslocamento em meses (negativo = passado).
 * @returns Nova chave YYYY-MM.
 */
export const shiftMonthKey = (month: string, delta: number): string => {
  const [year, monthIndex] = parseMonthKey(month);
  return formatMonthKey(year, monthIndex + delta);
};

/**
 * Rótulo extenso de um mês em português ("junho de 2026").
 *
 * @param month Mês (YYYY-MM).
 * @returns Rótulo humano.
 */
export const monthKeyLabel = (month: string): string => {
  const [year, monthIndex] = parseMonthKey(month);
  return `${MONTH_LABELS_PT[monthIndex] ?? ""} de ${year}`;
};

/**
 * Abreviação de um mês em português ("Jun").
 *
 * @param month Mês (YYYY-MM).
 * @returns Abreviação.
 */
export const monthKeyShort = (month: string): string => {
  const [, monthIndex] = parseMonthKey(month);
  return MONTH_ABBR_PT[monthIndex] ?? "";
};

/**
 * Resolve o ciclo de fatura de um cartão cujo fechamento cai no mês informado.
 *
 * Usa o dia de fechamento (clampado ao mês) como data de referência, garantindo
 * que o ciclo retornado tenha `billMonth === month`.
 *
 * @param card Cartão (precisa de `closing_day` e `due_day`).
 * @param month Mês de fatura (YYYY-MM).
 * @returns Preview do ciclo, ou null se o cartão não tem ciclo configurado.
 */
export const resolveCardCycleForMonth = (
  card: Pick<CreditCardDto, "closing_day" | "due_day">,
  month: string,
): BillingCyclePreview | null => {
  if (card.closing_day === null || card.due_day === null) {
    return null;
  }
  const [year, monthIndex] = parseMonthKey(month);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(card.closing_day, 1), lastDay);
  const referenceDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
  return resolveCreditCardBillingCycle({
    purchaseDate: referenceDate,
    closingDay: card.closing_day,
    dueDay: card.due_day,
  });
};
