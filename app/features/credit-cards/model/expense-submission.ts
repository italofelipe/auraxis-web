import type {
  CreateTransactionPayload,
  TransactionImpactPolicyDto,
  TransactionStatusDto,
} from "~/features/transactions/contracts/transaction.dto";
import { serializeCurrencyAmount } from "~/utils/currencyInput";

import { type InstallmentMode, computeInstallmentPlan } from "./installment-plan";

/** Valores do formulário de lançamento de despesa. */
export interface ExpenseFormValues {
  readonly title: string;
  readonly amount: number;
  /** Data da compra (YYYY-MM-DD). */
  readonly purchaseDate: string;
  /** Cartão (opcional — null nunca bloqueia o lançamento). */
  readonly creditCardId: string | null;
  readonly tagId: string | null;
  readonly accountId: string | null;
  readonly status: TransactionStatusDto;
  readonly impactPolicy: TransactionImpactPolicyDto;
  readonly mode: InstallmentMode;
  readonly installments: number;
  readonly hasDownPayment: boolean;
  readonly downPayment: number;
  readonly description: string;
}

/**
 * Constrói os payloads de criação de transação para uma despesa.
 *
 * A entrada (down payment) não existe no backend, então é modelada como uma
 * transação à vista separada (hoje) + o restante parcelado. Quando não há
 * entrada, retorna um único payload (à vista ou parcelado).
 *
 * @param values Valores do formulário.
 * @returns Lista de payloads (1 ou 2) a enviar sequencialmente.
 */
export const buildExpensePayloads = (
  values: ExpenseFormValues,
): CreateTransactionPayload[] => {
  const total = Math.max(0, values.amount);
  const isInstallment = values.mode === "parcelado";
  const useEntry = isInstallment && values.hasDownPayment;
  const plan = computeInstallmentPlan({
    total,
    downPayment: useEntry ? values.downPayment : 0,
    installments: values.installments,
  });

  const title = values.title.trim();
  const baseFields = {
    type: "expense" as const,
    due_date: values.purchaseDate,
    status: values.status,
    credit_card_id: values.creditCardId,
    tag_id: values.tagId,
    account_id: values.accountId,
    impact_policy: values.impactPolicy,
    ...(values.description.trim() ? { description: values.description.trim() } : {}),
  };

  const payloads: CreateTransactionPayload[] = [];

  if (plan.downPayment > 0) {
    payloads.push({
      ...baseFields,
      title,
      amount: serializeCurrencyAmount(plan.downPayment),
      is_installment: false,
    });
  }

  const remaining = plan.downPayment > 0 ? plan.financed : total;
  if (remaining > 0) {
    const installmentFields =
      isInstallment && values.installments >= 2
        ? { is_installment: true, installment_count: Math.floor(values.installments) }
        : { is_installment: false };
    payloads.push({
      ...baseFields,
      title,
      amount: serializeCurrencyAmount(remaining),
      ...installmentFields,
    });
  }

  return payloads;
};
