<script setup lang="ts">
import {
  NCard,
  NTag,
  NText,
  NButton,
  NList,
  NListItem,
  NSkeleton,
} from "naive-ui";
import { CheckIcon, XIcon } from "lucide-vue-next";
import { formatCurrency } from "~/utils/currency";
import type { PlanCardProps, PlanCardEmits } from "./PlanCard.types";

const { t } = useI18n();

const props = defineProps<PlanCardProps>();
const emit = defineEmits<PlanCardEmits>();

/** Active cycle, defaulting to monthly. */
const cycle = computed(() => props.billingCycle ?? "monthly");

/**
 * Returns the formatted price string for a plan based on the active billing cycle.
 * Returns the free label when the plan is free.
 *
 * @returns Formatted price string.
 */
const priceLabel = computed((): string => {
  if (props.plan.price_monthly === 0) { return t("subscription.planCard.free"); }
  const price = cycle.value === "annual" ? props.plan.price_annual : props.plan.price_monthly;
  return t("subscription.planCard.pricePerMonth", { price: formatCurrency(price) });
});

/** Shows the annual billing note when the annual cycle is active. */
const billedAnnuallyLabel = computed((): string | null => {
  if (cycle.value !== "annual" || props.plan.price_monthly === 0) { return null; }
  const total = props.plan.price_annual * 12;
  return t("subscription.planCard.billedAnnually", { total: formatCurrency(total) });
});

/** Handles the subscribe button click. */
const onSelect = (): void => {
  if (!props.isCurrent) {
    emit("select", props.plan.slug);
  }
};
</script>

<template>
  <NCard
    :bordered="true"
    class="plan-card"
    :class="{ 'plan-card--current': isCurrent }"
    content-style="padding: var(--space-3);"
  >
    <template v-if="props.loading">
      <NSkeleton height="16px" width="50%" :sharp="false" />
      <NSkeleton height="20px" width="65%" :sharp="false" style="margin-top: 8px;" />
      <NSkeleton height="14px" width="80%" :sharp="false" style="margin-top: 12px;" />
      <NSkeleton height="14px" width="75%" :sharp="false" style="margin-top: 6px;" />
      <NSkeleton height="14px" width="70%" :sharp="false" style="margin-top: 6px;" />
      <NSkeleton type="button" :sharp="false" style="margin-top: 16px; width: 100%;" />
    </template>

    <template v-else>
      <div class="plan-card__header">
        <NText class="plan-card__name" strong>{{ plan.name }}</NText>
        <NTag v-if="isCurrent" type="success" size="small" :bordered="false">
          {{ $t('subscription.planCard.currentPlan') }}
        </NTag>
      </div>

      <div class="plan-card__pricing">
        <NText class="plan-card__price">{{ priceLabel }}</NText>
        <NText v-if="billedAnnuallyLabel" class="plan-card__billed-annually" depth="3">
          {{ billedAnnuallyLabel }}
        </NText>
      </div>

      <NList class="plan-card__features" :show-divider="false">
        <NListItem
          v-for="feature in plan.features"
          :key="feature.label"
          class="plan-card__feature-item"
        >
          <div class="plan-card__feature-row">
            <span
              class="plan-card__feature-icon"
              :class="feature.included ? 'plan-card__feature-icon--included' : 'plan-card__feature-icon--excluded'"
            >
              <CheckIcon v-if="feature.included" :size="14" />
              <XIcon v-else :size="14" />
            </span>
            <NText
              class="plan-card__feature-label"
              :depth="feature.included ? 1 : 3"
            >
              {{ feature.label }}
            </NText>
          </div>
        </NListItem>
      </NList>

      <NButton
        type="primary"
        block
        :disabled="isCurrent"
        class="plan-card__cta"
        @click="onSelect"
      >
        {{ isCurrent ? $t('subscription.planCard.currentPlan') : $t('subscription.planCard.subscribe') }}
      </NButton>
    </template>
  </NCard>
</template>

<style scoped>
.plan-card {
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s ease;
}

.plan-card--current {
  border-color: var(--color-brand-600);
  border-width: 2px;
}

.plan-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.plan-card__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.plan-card__pricing {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--space-3);
}

.plan-card__price {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-brand-600);
  display: block;
}

.plan-card__billed-annually {
  font-size: var(--font-size-xs);
  display: block;
}

.plan-card__features {
  margin-bottom: var(--space-3);
  flex: 1 1 auto;
}

.plan-card__feature-item {
  padding: 4px 0;
}

.plan-card__feature-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.plan-card__feature-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.plan-card__feature-icon--included {
  color: var(--color-success);
}

.plan-card__feature-icon--excluded {
  color: var(--color-error);
  opacity: 0.5;
}

.plan-card__feature-label {
  font-size: var(--font-size-xs);
  line-height: 1.4;
}

.plan-card__cta {
  margin-top: auto;
}
</style>
