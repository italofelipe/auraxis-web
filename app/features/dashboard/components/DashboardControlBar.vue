<script setup lang="ts">
/**
 * DashboardControlBar — DS Wave-2
 *
 * Global control bar for the dashboard with period selector chips,
 * a mode toggle (Analítico / Essencial) and a notification icon.
 * Emits changes upward — does not hold state.
 *
 * Issues: #728
 */

import { Bell } from "lucide-vue-next";
import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Currently active period chip. */
  period: DashboardPeriod;
  /** Whether the user has unread notifications. */
  hasNotifications?: boolean;
}>();

// ── Emits ─────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  /** Emitted when the user selects a new period chip. */
  "update:period": [value: DashboardPeriod];
  /** Emitted when the notification icon is clicked. */
  "open-notifications": [];
}>();

// ── Period chips ─────────────────────────────────────────────────────────────

interface PeriodChip {
  readonly label: string;
  readonly value: DashboardPeriod;
}

const PERIOD_CHIPS: ReadonlyArray<PeriodChip> = [
  { label: "1m",   value: "1m"  },
  { label: "3m",   value: "3m"  },
  { label: "6m",   value: "6m"  },
  { label: "12m",  value: "12m" },
];
</script>

<template>
  <div class="dcb" role="toolbar" :aria-label="$t('dashboard.controlBar.ariaLabel', 'Barra de controle do dashboard')">
    <!-- Period chips -->
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
        {{ chip.label }}
      </button>
    </div>

    <div class="dcb__spacer" />

    <!-- Notification icon -->
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
  gap: var(--space-2);
  flex-wrap: wrap;
}

.dcb__spacer {
  flex: 1;
}

/* ── Period chips ──────────────────────────────────────────────────────────── */
.dcb__periods {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.dcb__chip {
  padding: 4px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  background: transparent;
  font: inherit;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--motion-fast), color var(--motion-fast), border-color var(--motion-fast);
}

.dcb__chip:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  border-color: var(--color-text-muted);
}

.dcb__chip--active {
  background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-brand-500) 30%, transparent);
  color: var(--color-brand-500);
}

/* ── Notification ──────────────────────────────────────────────────────────── */
.dcb__notification {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-outline-soft);
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
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: var(--color-negative);
}
</style>
