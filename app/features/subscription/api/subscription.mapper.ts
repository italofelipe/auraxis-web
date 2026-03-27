import type { ApiSubscriptionDto } from "~/features/subscription/contracts/subscription.dto";
import type { Subscription } from "~/features/subscription/model/subscription";

/**
 * Maps a raw subscription DTO from the API into the internal Subscription view model.
 *
 * @param dto Raw subscription payload from the API (snake_case).
 * @returns Mapped Subscription view model (camelCase).
 */
export const mapSubscriptionDto = (dto: ApiSubscriptionDto): Subscription => {
  return {
    id: dto.id,
    planSlug: dto.plan_slug,
    status: dto.status,
    trialEndsAt: dto.trial_ends_at,
    currentPeriodEnd: dto.current_period_end,
    provider: dto.provider,
    providerSubscriptionId: dto.provider_subscription_id,
  };
};
