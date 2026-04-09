<script setup lang="ts">
import { NModal, NStatistic, NTag } from "naive-ui";
import { computed } from "vue";
import { TrendingDown, TrendingUp } from "lucide-vue-next";
import type { CalendarDayDetailProps, CalendarDayDetailEmits } from "./CalendarDayDetail.types";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();

const props = defineProps<CalendarDayDetailProps>();
const emit = defineEmits<CalendarDayDetailEmits>();

/** Closes the modal. */
const onClose = (): void => {
  emit("update:visible", false);
};

/**
 * Formats a YYYY-MM-DD string as a human-readable date in pt-BR.
 *
 * @param isoDate - ISO date string YYYY-MM-DD.
 * @returns Formatted string like "10 de abril de 2026".
 */
const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${isoDate}T00:00:00`),
  );

/** Formatted title for the modal based on the selected day. */
const modalTitle = computed((): string => {
  if (!props.day) { return ""; }
  return formatDate(props.day.date);
});

/**
 * Returns the tag type for a transaction's status.
 *
 * @param tx - Transaction to classify.
 * @returns Naive UI tag type string.
 */
function statusType(tx: TransactionDto): "success" | "warning" | "error" | "default" {
  switch (tx.status) {
    case "paid": return "success";
    case "overdue": return "error";
    case "pending": return "warning";
    default: return "default";
  }
}

/**
 * Returns the human-readable label for a transaction status.
 *
 * @param tx - Transaction to label.
 * @returns Translated status label.
 */
function statusLabel(tx: TransactionDto): string {
  return t(`transaction.status.${tx.status}`);
}
</script>

<template>
  <NModal
    :show="props.visible"
    :title="modalTitle"
    preset="card"
    class="calendar-day-detail"
    style="max-width: 520px"
    @update:show="onClose"
  >
    <template v-if="props.day">
      <!-- Summary statistics -->
      <div class="calendar-day-detail__stats">
        <NStatistic
          :label="$t('financialCalendar.detail.income')"
          :value="formatCurrency(props.day.totalIncome)"
        />
        <NStatistic
          :label="$t('financialCalendar.detail.expense')"
          :value="formatCurrency(props.day.totalExpense)"
        />
        <NStatistic
          :label="$t('financialCalendar.detail.balance')"
          :value="formatCurrency(props.day.dailyBalance)"
        />
      </div>

      <!-- No transactions -->
      <UiEmptyState
        v-if="props.day.transactions.length === 0"
        icon="transactions"
        compact
        :title="$t('financialCalendar.detail.empty')"
      />

      <!-- Transaction list -->
      <ul v-else class="calendar-day-detail__list">
        <li
          v-for="tx in props.day.transactions"
          :key="tx.id"
          class="calendar-day-detail__item"
        >
          <span class="calendar-day-detail__item-icon">
            <TrendingUp
              v-if="tx.type === 'income'"
              :size="16"
              class="calendar-day-detail__income-icon"
            />
            <TrendingDown
              v-else
              :size="16"
              class="calendar-day-detail__expense-icon"
            />
          </span>

          <span class="calendar-day-detail__item-title">{{ tx.title }}</span>

          <NTag
            :type="statusType(tx)"
            size="tiny"
            :bordered="false"
            class="calendar-day-detail__item-status"
          >
            {{ statusLabel(tx) }}
          </NTag>

          <span
            class="calendar-day-detail__item-amount"
            :class="{
              'calendar-day-detail__item-amount--income': tx.type === 'income',
              'calendar-day-detail__item-amount--expense': tx.type === 'expense',
            }"
          >
            {{ tx.type === 'expense' ? '−' : '+' }}{{ formatCurrency(parseFloat(tx.amount)) }}
          </span>
        </li>
      </ul>

      <!-- Cash valley warning -->
      <p v-if="props.day.isCashValley" class="calendar-day-detail__valley-warning">
        {{ $t('financialCalendar.detail.valleyWarning') }}
      </p>
    </template>
  </NModal>
</template>

<style scoped>
.calendar-day-detail__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
}

.calendar-day-detail__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.calendar-day-detail__item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
}

.calendar-day-detail__item-icon {
  display: flex;
  align-items: center;
}

.calendar-day-detail__income-icon {
  color: var(--color-success, #27ae60);
}

.calendar-day-detail__expense-icon {
  color: var(--color-danger, #e74c3c);
}

.calendar-day-detail__item-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-day-detail__item-status {
  flex-shrink: 0;
}

.calendar-day-detail__item-amount {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.calendar-day-detail__item-amount--income {
  color: var(--color-success, #27ae60);
}

.calendar-day-detail__item-amount--expense {
  color: var(--color-danger, #e74c3c);
}

.calendar-day-detail__valley-warning {
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: color-mix(in srgb, var(--color-danger, #e74c3c) 10%, transparent);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  color: var(--color-danger, #e74c3c);
}
</style>
