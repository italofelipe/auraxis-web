<script setup lang="ts">
import { TrendingDown, TrendingUp, ChevronLeft, ChevronRight } from "lucide-vue-next";
import { computed, watch } from "vue";
import type { FinancialCalendarProps, FinancialCalendarEmits } from "./FinancialCalendar.types";
import {
  useFinancialCalendar,
  type CalendarDay,
} from "~/features/transactions/composables/useFinancialCalendar";
import { formatCurrency } from "~/utils/currency";

const props = withDefaults(defineProps<FinancialCalendarProps>(), {
  initialYear: undefined,
  initialMonth: undefined,
});

const emit = defineEmits<FinancialCalendarEmits>();

const {
  calendarDays,
  currentYear,
  currentMonth,
  monthLabel,
  isLoading,
  isError,
  goToPreviousMonth,
  goToNextMonth,
} = useFinancialCalendar();

// Sync optional initial overrides from props on first mount
if (props.initialYear !== undefined) {
  currentYear.value = props.initialYear;
}
if (props.initialMonth !== undefined) {
  currentMonth.value = props.initialMonth;
}

watch(
  () => props.initialYear,
  (val) => {
    if (val !== undefined) { currentYear.value = val; }
  },
);

watch(
  () => props.initialMonth,
  (val) => {
    if (val !== undefined) { currentMonth.value = val; }
  },
);

/** Short day headers starting Sunday (pt-BR). */
const DAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** 6 rows of 7 CalendarDay objects. */
const weeks = computed((): CalendarDay[][] => {
  const days = calendarDays.value;
  const result: CalendarDay[][] = [];
  for (let i = 0; i < 6; i++) {
    result.push(days.slice(i * 7, i * 7 + 7));
  }
  return result;
});

/**
 * Returns the CSS class(es) for a day cell.
 *
 * @param day - The CalendarDay to classify.
 * @returns Object of BEM modifier classes.
 */
function dayCellClass(day: CalendarDay): Record<string, boolean> {
  return {
    "financial-calendar__cell--inactive": !day.isCurrentMonth,
    "financial-calendar__cell--today": day.isToday,
    "financial-calendar__cell--valley": day.isCashValley,
  };
}

/**
 * Emits the day-click event when the user clicks a cell.
 *
 * @param day - The clicked CalendarDay.
 */
function onDayClick(day: CalendarDay): void {
  if (day.isCurrentMonth) {
    emit("day-click", day);
  }
}
</script>

<template>
  <UiSurfaceCard class="financial-calendar">
    <!-- Navigation header -->
    <div class="financial-calendar__header">
      <button
        class="financial-calendar__nav-btn"
        :aria-label="$t('financialCalendar.previousMonth')"
        @click="goToPreviousMonth"
      >
        <ChevronLeft :size="18" />
      </button>
      <span class="financial-calendar__month-label">{{ monthLabel }}</span>
      <button
        class="financial-calendar__nav-btn"
        :aria-label="$t('financialCalendar.nextMonth')"
        @click="goToNextMonth"
      >
        <ChevronRight :size="18" />
      </button>
    </div>

    <!-- Loading skeleton -->
    <UiPageLoader v-if="isLoading" :rows="5" />

    <!-- Error state -->
    <UiInlineError
      v-else-if="isError"
      :title="$t('financialCalendar.loadError')"
      :message="$t('financialCalendar.loadErrorMessage')"
    />

    <template v-else>
      <!-- Day-of-week headers -->
      <div class="financial-calendar__grid">
        <div
          v-for="header in DAY_HEADERS"
          :key="header"
          class="financial-calendar__day-header"
        >
          {{ header }}
        </div>

        <!-- Week rows -->
        <template v-for="(week, wi) in weeks" :key="wi">
          <button
            v-for="day in week"
            :key="day.date"
            class="financial-calendar__cell"
            :class="dayCellClass(day)"
            :aria-label="`${day.dayOfMonth} — ${formatCurrency(day.dailyBalance)}`"
            :aria-pressed="false"
            :disabled="!day.isCurrentMonth"
            @click="onDayClick(day)"
          >
            <span class="financial-calendar__cell-number">{{ day.dayOfMonth }}</span>

            <template v-if="day.isCurrentMonth">
              <div class="financial-calendar__cell-icons">
                <TrendingUp
                  v-if="day.totalIncome > 0"
                  :size="12"
                  class="financial-calendar__icon financial-calendar__icon--income"
                />
                <TrendingDown
                  v-if="day.totalExpense > 0"
                  :size="12"
                  class="financial-calendar__icon financial-calendar__icon--expense"
                />
              </div>

              <span
                v-if="day.totalIncome > 0 || day.totalExpense > 0"
                class="financial-calendar__cell-balance"
                :class="{
                  'financial-calendar__cell-balance--positive': day.dailyBalance > 0,
                  'financial-calendar__cell-balance--negative': day.dailyBalance < 0,
                }"
              >
                {{ formatCurrency(day.dailyBalance) }}
              </span>
            </template>
          </button>
        </template>
      </div>

      <!-- Legend -->
      <div class="financial-calendar__legend">
        <span class="financial-calendar__legend-item">
          <span class="financial-calendar__legend-dot financial-calendar__legend-dot--today" />
          {{ $t('financialCalendar.legendToday') }}
        </span>
        <span class="financial-calendar__legend-item">
          <span class="financial-calendar__legend-dot financial-calendar__legend-dot--valley" />
          {{ $t('financialCalendar.legendValley') }}
        </span>
      </div>
    </template>
  </UiSurfaceCard>
</template>

<style scoped>
.financial-calendar {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* ── Header ────────────────────────────────────────────────────────────────── */

.financial-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.financial-calendar__month-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  text-transform: capitalize;
  flex: 1;
  text-align: center;
}

.financial-calendar__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.financial-calendar__nav-btn:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

/* ── Grid ──────────────────────────────────────────────────────────────────── */

.financial-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.financial-calendar__day-header {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-1) 0;
}

/* ── Day cells ─────────────────────────────────────────────────────────────── */

.financial-calendar__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 72px;
  padding: var(--space-1);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.12s;
  gap: 2px;
  overflow: hidden;
}

.financial-calendar__cell:hover:not(:disabled) {
  background: var(--color-bg-elevated);
}

.financial-calendar__cell:disabled {
  cursor: default;
}

.financial-calendar__cell--inactive {
  opacity: 0.35;
}

.financial-calendar__cell--today {
  border-color: var(--color-brand-600);
  background: color-mix(in srgb, var(--color-brand-600) 8%, transparent);
}

.financial-calendar__cell--valley {
  background: color-mix(in srgb, var(--color-danger, #e74c3c) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-danger, #e74c3c) 30%, transparent);
}

.financial-calendar__cell-number {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1;
  align-self: flex-start;
}

.financial-calendar__cell--today .financial-calendar__cell-number {
  color: var(--color-brand-600);
}

.financial-calendar__cell-icons {
  display: flex;
  gap: 2px;
  align-items: center;
}

.financial-calendar__icon--income {
  color: var(--color-success, #27ae60);
}

.financial-calendar__icon--expense {
  color: var(--color-danger, #e74c3c);
}

.financial-calendar__cell-balance {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.financial-calendar__cell-balance--positive {
  color: var(--color-success, #27ae60);
}

.financial-calendar__cell-balance--negative {
  color: var(--color-danger, #e74c3c);
}

/* ── Legend ────────────────────────────────────────────────────────────────── */

.financial-calendar__legend {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  border-top: 1px solid var(--color-outline-soft);
  padding-top: var(--space-2);
}

.financial-calendar__legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.financial-calendar__legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.financial-calendar__legend-dot--today {
  background: var(--color-brand-600);
}

.financial-calendar__legend-dot--valley {
  background: color-mix(in srgb, var(--color-danger, #e74c3c) 50%, transparent);
  border: 1px solid var(--color-danger, #e74c3c);
}

/* ── Responsive ────────────────────────────────────────────────────────────── */

@media (max-width: 480px) {
  .financial-calendar__cell {
    min-height: 52px;
    padding: 2px;
  }

  .financial-calendar__cell-balance {
    display: none;
  }
}
</style>
