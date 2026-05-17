import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";

export type GoalAITransactionSummary = {
  readonly incomeTotal: number;
  readonly expenseTotal: number;
  readonly netFlow: number;
  readonly transactionCount: number;
};

type BuildGoalAIProjectionContextInput = {
  readonly userContext: string;
  readonly recentTransactions: readonly TransactionDto[];
};

/**
 * Parses backend decimal strings into numbers for prompt summaries.
 *
 * @param value Decimal string received in a transaction DTO.
 * @returns Numeric amount, or zero when invalid.
 */
const parseAmount = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Formats currency with regular spaces so AI prompts and tests stay stable.
 *
 * @param value Monetary value.
 * @returns Currency label with non-breaking spaces normalized.
 */
const formatContextCurrency = (value: number): string => {
  return formatCurrency(value).replace(/\u00A0/g, " ");
};

/**
 * Summarizes recent transactions into the financial context sent to AI.
 *
 * @param transactions Transactions fetched for the last 90 days.
 * @returns Income, expense and net-flow summary.
 */
export const summarizeGoalAITransactions = (
  transactions: readonly TransactionDto[],
): GoalAITransactionSummary => {
  return transactions.reduce<GoalAITransactionSummary>(
    (summary, transaction) => {
      const amount = parseAmount(transaction.amount);

      if (transaction.type === "income") {
        const incomeTotal = summary.incomeTotal + amount;
        return {
          ...summary,
          incomeTotal,
          netFlow: incomeTotal - summary.expenseTotal,
        };
      }

      const expenseTotal = summary.expenseTotal + amount;
      return {
        ...summary,
        expenseTotal,
        netFlow: summary.incomeTotal - expenseTotal,
      };
    },
    {
      incomeTotal: 0,
      expenseTotal: 0,
      netFlow: 0,
      transactionCount: transactions.length,
    },
  );
};

/**
 * Builds the free-form context payload consumed by the goal projection endpoint.
 *
 * @param input User note and recent transaction list.
 * @param input.userContext Free-form user note.
 * @param input.recentTransactions Transactions fetched for the last 90 days.
 * @returns Prompt context containing user note plus 90-day transaction summary.
 */
export const buildGoalAIProjectionContext = ({
  userContext,
  recentTransactions,
}: BuildGoalAIProjectionContextInput): string => {
  const summary = summarizeGoalAITransactions(recentTransactions);
  const userNote = userContext.trim() || "Usuario nao informou contexto adicional.";

  return [
    `Contexto informado pelo usuario: ${userNote}`,
    `Ultimos 90 dias: ${summary.transactionCount} transacoes; entradas ${formatContextCurrency(summary.incomeTotal)}; saidas ${formatContextCurrency(summary.expenseTotal)}; saldo ${formatContextCurrency(summary.netFlow)}`,
  ].join("\n");
};
