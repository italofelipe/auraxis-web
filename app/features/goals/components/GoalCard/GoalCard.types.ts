import type { GoalDto } from "../../contracts/goal.dto";

export type GoalCardProps = {
  goal: GoalDto;
  loading?: boolean;
};
