import type { GoalDto } from "~/features/goals/contracts/goal.dto";

export type GoalSimulatePanelProps = {
  goal: GoalDto;
  initialMonthly?: number;
};
