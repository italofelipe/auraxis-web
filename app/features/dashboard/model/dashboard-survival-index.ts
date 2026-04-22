import type { SurvivalClassificationDto } from "~/features/dashboard/contracts/dashboard-overview.dto";

export type SurvivalClassification = SurvivalClassificationDto;

export interface DashboardSurvivalIndex {
  /** Number of months the user's assets can cover their average monthly expense. `null` when not computable. */
  readonly months: number | null;
  readonly totalAssets: number;
  readonly avgMonthlyExpense: number;
  readonly classification: SurvivalClassification | null;
}

export const SURVIVAL_CLASSIFICATION_LABEL: Record<SurvivalClassification, string> = {
  critical: "Crítico",
  low: "Baixo",
  ok: "Confortável",
  comfortable: "Ótimo",
};
