<script setup lang="ts">
import { AlertCircle } from "lucide-vue-next";

import type { DashboardAlert } from "~/features/dashboard/model/dashboard-overview";


interface Props {
  alerts: DashboardAlert[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

/**
 * Resolves the CSS modifier class for a given alert type.
 *
 * @param alert The alert item to evaluate.
 * @returns BEM modifier class for the alert card tone.
 */
const alertToneClass = (alert: DashboardAlert): string => {
  if (alert.type.includes("due") || alert.type.includes("negative")) {
    return "alert-card alert-card--warning";
  }
  if (alert.type.includes("goal")) {
    return "alert-card alert-card--info";
  }
  return "alert-card";
};
</script>

<template>
  <UiBaseCard :title="$t('dashboard.alerts.title')">
    <BaseSkeleton v-if="props.isLoading" style="height: 80px" />

    <div v-else-if="props.alerts.length === 0" class="alerts-empty">
      <AlertCircle class="alerts-empty__icon" :size="28" aria-hidden="true" />
      <p>{{ $t('dashboard.alerts.empty') }}</p>
    </div>

    <div v-else class="alerts-list" role="list" :aria-label="$t('dashboard.alerts.listAriaLabel')">
      <article
        v-for="alert in props.alerts"
        :key="`${alert.type}-${alert.title}`"
        :class="alertToneClass(alert)"
        role="listitem"
      >
        <div class="alert-card__header">
          <AlertCircle :size="16" aria-hidden="true" />
          <strong>{{ alert.title }}</strong>
        </div>
        <p>{{ alert.description ?? $t('dashboard.alerts.noDetails') }}</p>
        <small v-if="alert.actionLabel">{{ alert.actionLabel }}</small>
      </article>
    </div>
  </UiBaseCard>
</template>

<style scoped>
.alerts-empty {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-block: var(--space-2);
  color: var(--color-neutral-600);
}

.alerts-empty__icon {
  color: var(--color-neutral-400);
  flex-shrink: 0;
}

.alerts-empty p {
  margin: 0;
}

.alerts-list {
  display: grid;
  gap: var(--space-2);
}

.alert-card {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  padding: var(--space-2);
  background: var(--color-bg-elevated);
  display: grid;
  gap: 6px;
}

.alert-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alert-card p,
.alert-card small {
  margin: 0;
  color: var(--color-text-muted);
}

.alert-card--warning {
  border-color: var(--color-negative-bg);
  background: var(--color-negative-bg);
}

.alert-card--info {
  border-color: var(--color-warning-bg);
  background: var(--color-warning-bg);
}
</style>
