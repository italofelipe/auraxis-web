import type { DashboardSurvivalIndex } from "~/features/dashboard/model/dashboard-survival-index";

export interface SurvivalIndexCardProps {
  /** Latest survival-index model; `null` renders the empty state. */
  data: DashboardSurvivalIndex | null;
  /** Whether the underlying query is still loading. */
  loading?: boolean;
}

export type SurvivalTier = "critical" | "low" | "ok" | "comfortable";
