import type {
  BillingCycle,
  PlanDto,
  PlanSlug,
} from "~/features/subscription/contracts/subscription.dto";

export type PlanCardProps = {
  plan: PlanDto;
  isCurrent: boolean;
  loading?: boolean;
  /** Active billing cycle — drives the displayed price. Defaults to "monthly". */
  billingCycle?: BillingCycle;
};

export type PlanCardEmits = {
  /** Emitted when the user clicks the subscribe button. Not emitted when isCurrent is true. */
  (event: "select", slug: PlanSlug): void;
};
