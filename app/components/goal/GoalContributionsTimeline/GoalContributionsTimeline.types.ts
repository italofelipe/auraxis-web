import type { GoalContributionDto } from "~/features/goals/contracts/contributions.dto";

/** Props for the GoalContributionsTimeline component. */
export type GoalContributionsTimelineProps = {
  /** Contributions to render, newest first. */
  items?: GoalContributionDto[];
  /** Whether the contributions are loading. */
  loading?: boolean;
  /** Whether loading the contributions failed. */
  error?: boolean;
};
