<script setup lang="ts">
import { computed } from "vue";
import { NButton, NCard } from "naive-ui";
import { Lock, Radar } from "lucide-vue-next";

import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import SpendingInsightContent from "~/features/spending-patterns/components/SpendingInsightContent.vue";

const { t } = useI18n();

const entitlement = useEntitlementQuery("advanced_simulations");
const hasPremium = computed<boolean>(() => entitlement.data.value === true);
</script>

<template>
  <NCard :bordered="true" class="spending-insight-card" data-testid="spending-insight-card">
    <template #header>
      <span class="spending-insight-card__header">
        <Radar :size="18" aria-hidden="true" />
        {{ t("spendingPatterns.title") }}
      </span>
    </template>

    <!-- Free users: premium teaser. The premium content component (and its
         transaction/pattern queries) only mounts when the user is premium. -->
    <div v-if="!hasPremium" class="spending-insight-card__locked" data-testid="spending-insight-locked">
      <Lock :size="20" aria-hidden="true" />
      <p class="spending-insight-card__locked-title">{{ t("spendingPatterns.locked.title") }}</p>
      <p class="spending-insight-card__locked-desc">{{ t("spendingPatterns.locked.description") }}</p>
      <NButton type="primary" tag="a" href="/subscription" size="small">
        {{ t("spendingPatterns.locked.cta") }}
      </NButton>
    </div>

    <SpendingInsightContent v-else />
  </NCard>
</template>

<style scoped>
.spending-insight-card {
  border-radius: var(--radius-xl);
}

.spending-insight-card__header {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.spending-insight-card__locked {
  display: grid;
  justify-items: start;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}

.spending-insight-card__locked-title {
  margin: 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.spending-insight-card__locked-desc {
  margin: 0;
  color: var(--color-text-secondary);
}
</style>
