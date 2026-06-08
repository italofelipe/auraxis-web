import type { GoalDto } from "~/features/goals/contracts/goal.dto";

/** Props for the GoalContributionModal component. */
export type GoalContributionModalProps = {
  /** Controls modal visibility. */
  visible: boolean;
  /** Goal the contribution will be recorded against. */
  goal: GoalDto;
};

/** Emits for the GoalContributionModal component. */
export type GoalContributionModalEmits = {
  "update:visible": [value: boolean];
  /** Emitted after a contribution is successfully recorded. */
  recorded: [];
};
