import type { GoalDto } from "~/features/goals/contracts/goal.dto";

export interface GoalFormProps {
  visible: boolean;
  goal?: GoalDto | null;
}
