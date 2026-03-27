import type { PlanDto, PlanSlug } from "../../contracts/subscription.dto";

export type PlanCardProps = {
  plan: PlanDto;
  isCurrent: boolean;
  loading?: boolean;
};

export type PlanCardEmits = {
  /** Emitted when the user clicks the subscribe button. Not emitted when isCurrent is true. */
  (event: "select", slug: PlanSlug): void;
};
