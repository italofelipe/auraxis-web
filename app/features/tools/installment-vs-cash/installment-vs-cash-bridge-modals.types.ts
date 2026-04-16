import type { InjectionKey } from "vue";

import type { SelectedPaymentOption } from "~/features/tools/model/installment-vs-cash";

export interface InstallmentVsCashGoalForm {
  title: string;
  selectedOption: SelectedPaymentOption;
  description: string;
  targetDate: number | null;
}

export interface InstallmentVsCashPlannedExpenseForm {
  title: string;
  selectedOption: SelectedPaymentOption;
  description: string;
  dueDate: number | null;
  firstDueDate: number | null;
  upfrontDueDate: number | null;
}

export const INSTALLMENT_VS_CASH_GOAL_FORM_KEY: InjectionKey<InstallmentVsCashGoalForm> =
  Symbol("InstallmentVsCashGoalForm");

export const INSTALLMENT_VS_CASH_EXPENSE_FORM_KEY: InjectionKey<InstallmentVsCashPlannedExpenseForm> =
  Symbol("InstallmentVsCashExpenseForm");
