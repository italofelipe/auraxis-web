import type { InjectionKey } from "vue";

export interface ThirteenthSalaryGoalForm {
  name: string;
  targetDate: number | null;
}

export const THIRTEENTH_SALARY_GOAL_FORM_KEY: InjectionKey<ThirteenthSalaryGoalForm> =
  Symbol("ThirteenthSalaryGoalForm");
