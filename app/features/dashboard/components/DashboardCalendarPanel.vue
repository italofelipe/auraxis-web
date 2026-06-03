<script setup lang="ts">
import { ref } from "vue";
import type { CalendarDay } from "~/shared/types/financial-calendar";

/** The day whose detail modal is currently open, or null when closed. */
const selectedDay = ref<CalendarDay | null>(null);
/** Controls the visibility of the day-detail modal. */
const showDayDetail = ref(false);

/**
 * Opens the day-detail modal for the clicked calendar day.
 *
 * @param day - The CalendarDay emitted by the FinancialCalendar.
 */
function onDayClick(day: CalendarDay): void {
  selectedDay.value = day;
  showDayDetail.value = true;
}
</script>

<template>
  <UiSurfaceCard class="dashboard-calendar-panel">
    <header class="dashboard-calendar-panel__header">
      <h3 class="dashboard-calendar-panel__title">{{ $t('dashboard.calendar.title') }}</h3>
    </header>

    <FinancialCalendar
      class="dashboard-calendar-panel__calendar"
      @day-click="onDayClick"
    />

    <!--
      On close we only flip `showDayDetail` to false; `selectedDay` is intentionally
      NOT cleared so the modal's close animation can play without its content
      flashing away mid-transition.
    -->
    <CalendarDayDetail
      :day="selectedDay"
      :visible="showDayDetail"
      @update:visible="showDayDetail = $event"
    />
  </UiSurfaceCard>
</template>

<style scoped>
.dashboard-calendar-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dashboard-calendar-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard-calendar-panel__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.dashboard-calendar-panel__calendar {
  width: 100%;
}
</style>
