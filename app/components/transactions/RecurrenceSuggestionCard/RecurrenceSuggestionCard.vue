<script setup lang="ts">
/**
 * RecurrenceSuggestionCard — PROD-13-2
 *
 * Displays a single detected recurrence pattern and lets the user:
 *   • Confirm → emits "confirm" so the parent can open a pre-filled form.
 *   • Dismiss (session) → emits "dismiss" (parent hides card for the session).
 *   • Never suggest → emits "never" (parent persists to localStorage).
 *
 * Issues: #533 (parent), #560
 */

import { computed } from "vue";
import { RefreshCw, X } from "lucide-vue-next";
import type { RecurrencePattern } from "~/features/transactions/composables/useRecurrenceDetection";
import { formatCurrency } from "~/utils/currency";

// ── Props ─────────────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Detected recurrence pattern to display. */
  pattern: RecurrencePattern;
}>();

// ── Emits ─────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  /** User clicked "Create as recurring" — parent opens pre-filled modal. */
  confirm: [pattern: RecurrencePattern];
  /** User clicked "Dismiss" — hide for this session only. */
  dismiss: [groupKey: string];
  /** User clicked "Never suggest" — parent persists to localStorage. */
  never: [groupKey: string];
}>();

// ── Computed ──────────────────────────────────────────────────────────────────

const confidenceLabel = computed<string>(() => {
  const map: Record<RecurrencePattern["confidence"], string> = {
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  };
  return map[props.pattern.confidence];
});

const confidenceClass = computed<string>(() => {
  return `rsc__badge--${props.pattern.confidence}`;
});

const formattedAmount = computed<string>(() =>
  formatCurrency(props.pattern.medianAmount),
);

const formattedAnnual = computed<string>(() =>
  formatCurrency(props.pattern.annualImpact),
);

// ── Handlers ──────────────────────────────────────────────────────────────────

/** @param pattern The pattern to confirm. */
function handleConfirm(pattern: RecurrencePattern): void {
  emit("confirm", pattern);
}

/** @param groupKey The pattern group key to dismiss. */
function handleDismiss(groupKey: string): void {
  emit("dismiss", groupKey);
}

/** @param groupKey The pattern group key to never suggest again. */
function handleNever(groupKey: string): void {
  emit("never", groupKey);
}
</script>

<template>
  <div class="rsc" role="status" aria-label="Sugestão de recorrência detectada">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="rsc__header">
      <RefreshCw :size="16" class="rsc__icon" aria-hidden="true" />
      <span class="rsc__title">Recorrência detectada</span>
      <span :class="['rsc__badge', confidenceClass]" :title="`Confiança ${confidenceLabel}`">
        {{ confidenceLabel }}
      </span>
    </div>

    <!-- ── Body ──────────────────────────────────────────────────────────── -->
    <p class="rsc__message">
      Detectamos que você paga
      <strong>{{ formattedAmount }}</strong>
      todo mês para <strong>{{ pattern.label }}</strong>.
      Deseja criar como recorrência?
    </p>

    <p class="rsc__projection">
      Impacto anual estimado: <strong>{{ formattedAnnual }}</strong>
    </p>

    <!-- ── Actions ───────────────────────────────────────────────────────── -->
    <div class="rsc__actions">
      <button
        type="button"
        class="rsc__btn rsc__btn--primary"
        @click="handleConfirm(pattern)"
      >
        <RefreshCw :size="14" aria-hidden="true" />
        Sim, criar como recorrência
      </button>
      <button
        type="button"
        class="rsc__btn rsc__btn--ghost"
        @click="handleDismiss(pattern.groupKey)"
      >
        Ignorar agora
      </button>
      <button
        type="button"
        class="rsc__btn rsc__btn--muted"
        :title="`Nunca mais sugerir para ${pattern.label}`"
        @click="handleNever(pattern.groupKey)"
      >
        <X :size="12" aria-hidden="true" />
        Nunca mais
      </button>
    </div>
  </div>
</template>

<style scoped>
.rsc {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-left: 4px solid var(--color-brand-500);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  display: grid;
  gap: var(--space-2);
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.rsc__header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.rsc__icon {
  color: var(--color-brand-600);
  flex-shrink: 0;
}

.rsc__title {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  flex: 1;
}

/* ── Confidence badge ────────────────────────────────────────────────────────── */
.rsc__badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.rsc__badge--high {
  background: color-mix(in srgb, var(--color-positive) 15%, transparent);
  color: var(--color-positive);
}

.rsc__badge--medium {
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  color: var(--color-warning);
}

.rsc__badge--low {
  background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);
  color: var(--color-text-muted);
}

/* ── Body ────────────────────────────────────────────────────────────────────── */
.rsc__message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.rsc__projection {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Actions ─────────────────────────────────────────────────────────────────── */
.rsc__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.rsc__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  padding: 6px var(--space-2);
  line-height: 1;
}

.rsc__btn--primary {
  background: var(--color-brand-600);
  color: var(--color-bg-base);
}

.rsc__btn--primary:hover {
  background: var(--color-brand-500);
}

.rsc__btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-outline-soft);
}

.rsc__btn--ghost:hover {
  background: var(--color-bg-base);
}

.rsc__btn--muted {
  background: transparent;
  color: var(--color-text-muted);
  padding: 6px 8px;
  margin-left: auto;
}

.rsc__btn--muted:hover {
  color: var(--color-negative);
}
</style>
