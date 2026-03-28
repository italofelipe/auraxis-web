import type { GoalDto } from "~/features/goals/contracts/goal.dto";

export type GoalCardProps = {
  goal: GoalDto;
  loading?: boolean;
};
