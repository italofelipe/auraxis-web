<script setup lang="ts">
/**
 * DueDateList — PROD-14-1
 *
 * Displays upcoming and overdue transactions grouped by urgency band:
 *   • Overdue  — due_date < today
 *   • Critical — due in < 3 days
 *   • Warning  — due in 3–7 days
 *   • Upcoming — due in > 7 days
 *
 * Provides an in-app urgency alert (shown when critical/overdue items exist)
 * and a one-click export to .ics (RFC 5545 VCALENDAR).
 *
 * Issues: #545 (parent PROD-14), #580
 */

import { computed, ref } from "vue";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  TrendingDown,
  TrendingUp,
} from "lucide-vue-next";
import type { DueTransactionDto } from "~/features/transactions/contracts/due-range.dto";
import { downloadICalFile } from "~/features/transactions/utils/ical-export";
import { formatCurrency } from "~/utils/currency";

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Full list of due transactions (all urgency bands combined). */
  transactions: readonly DueTransactionDto[];
  /** Whether the query is currently loading. */
  isLoading?: boolean;
}>();

// ── Types ─────────────────────────────────────────────────────────────────────

type UrgencyBand = "overdue" | "critical" | "warning" | "upcoming";

interface BandedGroup {
  readonly band: UrgencyBand;
  readonly label: string;
  readonly items: DueTransactionDto[];
}

// ── Urgency classification ────────────────────────────────────────────────────

/**
 * Returns the urgency band for a transaction given today's date.
 *
 * @param dueDate - ISO due date string (YYYY-MM-DD).
 * @param todayMs - Today's timestamp in ms (midnight UTC).
 * @returns Urgency band.
 */
function classifyUrgency(dueDate: string, todayMs: number): UrgencyBand {
  const dueMs = new Date(`${dueDate}T00:00:00`).getTime();
  const diffDays = (dueMs - todayMs) / 86_400_000;
  if (diffDays < 0) { return "overdue"; }
  if (diffDays < 3) { return "critical"; }
  if (diffDays < 7) { return "warning"; }
  return "upcoming";
}

const BAND_META: Record<UrgencyBand, { label: string; order: number }> = {
  overdue:  { label: "Vencido",          order: 0 },
  critical: { label: "Vence em < 3 dias", order: 1 },
  warning:  { label: "Vence em < 7 dias", order: 2 },
  upcoming: { label: "Próximos",          order: 3 },
};

// ── Computed groups ───────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

const groups = computed<BandedGroup[]>(() => {
  const map = new Map<UrgencyBand, DueTransactionDto[]>();

  for (const tx of props.transactions) {
    const band = classifyUrgency(tx.due_date, todayMs);
    const bucket = map.get(band) ?? [];
    bucket.push(tx);
    map.set(band, bucket);
  }

  return (["overdue", "critical", "warning", "upcoming"] as UrgencyBand[])
    .filter((band) => map.has(band))
    .map((band) => ({
      band,
      label: BAND_META[band].label,
      items: (map.get(band) ?? []).sort(
        (a, b) => a.due_date.localeCompare(b.due_date),
      ),
    }));
});

const hasUrgentItems = computed<boolean>(
  () => groups.value.some((g) => g.band === "overdue" || g.band === "critical"),
);

const alertDismissed = ref(false);

/** @returns True when the in-app urgent alert should be visible. */
const showAlert = computed<boolean>(
  () => hasUrgentItems.value && !alertDismissed.value,
);

// ── iCal export ───────────────────────────────────────────────────────────────

/**
 * Triggers a browser download of the visible transactions as an .ics file.
 */
function handleExport(): void {
  downloadICalFile([...props.transactions]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string as dd/MM/yyyy.
 *
 * @param isoDate - ISO 8601 date string.
 * @returns Localised date string.
 */
function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}
</script>

<template>
  <div class="ddl">
    <!-- ── In-app urgency alert ─────────────────────────────────────────────── -->
    <div
      v-if="showAlert"
      class="ddl__alert"
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle :size="16" class="ddl__alert-icon" aria-hidden="true" />
      <span>Você tem contas vencidas ou que vencem em menos de 3 dias.</span>
      <button
        type="button"
        class="ddl__alert-close"
        aria-label="Fechar alerta"
        @click="alertDismissed = true"
      >
        ×
      </button>
    </div>

    <!-- ── Header / export ─────────────────────────────────────────────────── -->
    <div class="ddl__header">
      <div class="ddl__header-left">
        <Calendar :size="16" aria-hidden="true" />
        <h3 class="ddl__title">Central de Vencimentos</h3>
      </div>
      <button
        v-if="transactions.length > 0"
        type="button"
        class="ddl__export-btn"
        :title="`Exportar ${transactions.length} vencimento(s) como .ics`"
        @click="handleExport"
      >
        <Download :size="14" aria-hidden="true" />
        Exportar .ics
      </button>
    </div>

    <!-- ── Loading skeleton ────────────────────────────────────────────────── -->
    <template v-if="isLoading">
      <BaseSkeleton v-for="i in 4" :key="i" class="ddl__skeleton" />
    </template>

    <!-- ── Empty state ─────────────────────────────────────────────────────── -->
    <UiEmptyState
      v-else-if="!isLoading && transactions.length === 0"
      icon="calendarCheck"
      title="Nenhum vencimento no período"
      description="Não há transações a vencer nos próximos 30 dias."
      :compact="true"
    />

    <!-- ── Groups ───────────────────────────────────────────────────────────── -->
    <template v-else>
      <section
        v-for="group in groups"
        :key="group.band"
        :class="['ddl__group', `ddl__group--${group.band}`]"
      >
        <h4 class="ddl__group-label">{{ group.label }}</h4>

        <ul class="ddl__list" role="list">
          <li
            v-for="tx in group.items"
            :key="tx.id"
            class="ddl__item"
          >
            <span class="ddl__item-type" aria-hidden="true">
              <TrendingDown v-if="tx.type === 'expense'" :size="14" />
              <TrendingUp v-else :size="14" />
            </span>
            <div class="ddl__item-body">
              <span class="ddl__item-title">{{ tx.title }}</span>
              <span class="ddl__item-date">
                <Clock :size="11" aria-hidden="true" />
                {{ formatDate(tx.due_date) }}
              </span>
            </div>
            <span class="ddl__item-amount">
              {{ formatCurrency(parseFloat(tx.amount)) }}
            </span>
            <span
              v-if="tx.status === 'paid'"
              class="ddl__item-paid"
              aria-label="Pago"
            >
              <CheckCircle2 :size="14" />
            </span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.ddl {
  display: grid;
  gap: var(--space-3);
}

/* ── Alert ────────────────────────────────────────────────────────────────────── */
.ddl__alert {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: color-mix(in srgb, var(--color-negative) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-negative) 30%, transparent);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-negative);
}

.ddl__alert-icon {
  flex-shrink: 0;
}

.ddl__alert-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: var(--font-size-base);
  line-height: 1;
  padding: 0 4px;
}

/* ── Header ───────────────────────────────────────────────────────────────────── */
.ddl__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.ddl__header-left {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
}

.ddl__title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.ddl__export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.ddl__export-btn:hover {
  background: var(--color-bg-base);
  color: var(--color-text-primary);
}

/* ── Skeleton ────────────────────────────────────────────────────────────────── */
.ddl__skeleton {
  height: 48px;
  border-radius: var(--radius-sm);
}

/* ── Groups ───────────────────────────────────────────────────────────────────── */
.ddl__group {
  display: grid;
  gap: var(--space-1);
}

.ddl__group-label {
  margin: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-outline-soft);
}

.ddl__group--overdue  .ddl__group-label { color: var(--color-negative); }
.ddl__group--critical .ddl__group-label { color: var(--color-negative); }
.ddl__group--warning  .ddl__group-label { color: var(--color-warning); }
.ddl__group--upcoming .ddl__group-label { color: var(--color-text-muted); }

/* ── List ─────────────────────────────────────────────────────────────────────── */
.ddl__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
}

/* ── Item ─────────────────────────────────────────────────────────────────────── */
.ddl__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  transition: background 0.1s;
}

.ddl__item:hover {
  background: var(--color-bg-base);
}

.ddl__group--overdue  .ddl__item,
.ddl__group--critical .ddl__item {
  border-left: 3px solid var(--color-negative);
}

.ddl__group--warning .ddl__item {
  border-left: 3px solid var(--color-warning);
}

.ddl__item-type {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.ddl__item-body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.ddl__item-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ddl__item-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.ddl__item-amount {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  flex-shrink: 0;
}

.ddl__item-paid {
  color: var(--color-positive);
  flex-shrink: 0;
}
</style>
