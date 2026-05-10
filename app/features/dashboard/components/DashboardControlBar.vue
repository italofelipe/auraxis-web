<script setup lang="ts">
/**
 * DashboardControlBar — Market Pulse dashboard command bar.
 *
 * Keeps period and reading-mode state outside the component so the page can
 * coordinate queries, custom ranges and future saved views without hidden state.
 */

import { Bell, CalendarDays } from "lucide-vue-next";
import type { DashboardPeriodPreset } from "~/features/dashboard/model/dashboard-overview";

type DashboardViewMode = "analytical" | "essential";

const props = withDefaults(defineProps<{
  /** Currently active period chip. */
  period: DashboardPeriodPreset;
  /** Active dashboard reading mode. */
  mode?: DashboardViewMode;
  /** Whether the user has unread notifications. */
  hasNotifications?: boolean;
}>(), {
  mode: "analytical",
  hasNotifications: false,
});

const emit = defineEmits<{
  /** Emitted when the user selects a new period chip. */
  "update:period": [value: DashboardPeriodPreset];
  /** Emitted when the user switches between analytical and essential modes. */
  "update:mode": [value: DashboardViewMode];
  /** Emitted when the notification icon is clicked. */
  "open-notifications": [];
}>();

interface PeriodChip {
  readonly label: string;
  readonly value: DashboardPeriodPreset;
}

const PERIOD_CHIPS: ReadonlyArray<PeriodChip> = [
  { label: "Mês", value: "current_month" },
  { label: "3m", value: "3m" },
  { label: "6m", value: "6m" },
  { label: "12m", value: "12m" },
  { label: "Custom", value: "custom" },
];
</script>

<template>
  <div class="dcb" role="toolbar" :aria-label="$t('dashboard.controlBar.ariaLabel', 'Barra de controle do dashboard')">
    <div class="dcb__periods" role="group" :aria-label="$t('dashboard.controlBar.periodAriaLabel', 'Período')">
      <button
        v-for="chip in PERIOD_CHIPS"
        :key="chip.value"
        type="button"
        class="dcb__chip"
        :class="{ 'dcb__chip--active': props.period === chip.value }"
        :aria-pressed="props.period === chip.value"
        @click="emit('update:period', chip.value)"
      >
        <CalendarDays
          v-if="chip.value === 'custom'"
          :size="14"
          aria-hidden="true"
        />
        {{ chip.label }}
      </button>
    </div>

    <div class="dcb__spacer" />

    <div class="dcb__mode" role="group" aria-label="Modo de leitura">
      <button
        type="button"
        class="dcb__mode-button"
        :class="{ 'dcb__mode-button--active': props.mode === 'analytical' }"
        :aria-pressed="props.mode === 'analytical'"
        @click="emit('update:mode', 'analytical')"
      >
        Modo Analítico
      </button>
      <button
        type="button"
        class="dcb__mode-button"
        :class="{ 'dcb__mode-button--active': props.mode === 'essential' }"
        :aria-pressed="props.mode === 'essential'"
        @click="emit('update:mode', 'essential')"
      >
        Modo Essencial
      </button>
    </div>

    <button
      type="button"
      class="dcb__notification"
      :aria-label="$t('dashboard.controlBar.notificationsAriaLabel', 'Notificações')"
      @click="emit('open-notifications')"
    >
      <Bell :size="16" aria-hidden="true" />
      <span
        v-if="props.hasNotifications"
        class="dcb__notification-dot"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<style scoped>
.dcb {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.dcb__spacer {
  flex: 1;
}

.dcb__periods {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.dcb__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: var(--space-6);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: var(--space-px) solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
}

.dcb__chip:hover {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  border-color: var(--color-text-muted);
}

.dcb__chip--active {
  background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-brand-500) 30%, transparent);
  color: var(--color-brand-500);
}

.dcb__mode {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  border: var(--space-px) solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.dcb__mode-button {
  min-height: var(--space-6);
  padding: var(--space-1) var(--space-3);
  border: var(--space-px) solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
}

.dcb__mode-button:hover {
  color: var(--color-text-primary);
}

.dcb__mode-button--active {
  border-color: var(--color-outline-soft);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}

.dcb__notification {
  position: relative;
  width: var(--space-6);
  height: var(--space-6);
  border-radius: var(--radius-full);
  border: var(--space-px) solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color var(--motion-fast), background var(--motion-fast);
  flex-shrink: 0;
}

.dcb__notification:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
}

.dcb__notification-dot {
  position: absolute;
  inset-block-start: var(--space-1);
  inset-inline-end: var(--space-1);
  width: var(--space-2);
  height: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-negative);
}

@media (max-width: 640px) {
  .dcb__mode {
    width: 100%;
  }

  .dcb__mode-button {
    flex: 1;
  }

  .dcb__spacer {
    display: none;
  }
}

@media (max-width: 480px) {
  .dcb__periods {
    width: 100%;
  }
}
</style>
