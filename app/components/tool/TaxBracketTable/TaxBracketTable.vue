<script setup lang="ts">
/**
 * TaxBracketTable
 *
 * Presentational component for displaying progressive tax bracket breakdowns.
 * Accepts pre-formatted row data so the component stays pure (no currency
 * formatting logic) and remains reusable for both INSS and IRRF tables.
 */

/** A single row in the bracket table. */
export interface TaxBracketRow {
  /** Unique key used as the v-for key. */
  key: string
  /** Human-readable bracket range label (e.g., "Até R$ 1.518,00"). */
  rangeLabel: string
  /** Formatted rate string (e.g., "7,5%"). */
  rateLabel: string
  /** Formatted base/slice amount (e.g., "R$ 1.518,00") or a dash when inactive. */
  baseLabel: string
  /** Formatted tax/contribution amount (e.g., "R$ 113,85") or a dash when inactive. */
  taxLabel: string
  /** Whether this bracket is active (salary reaches it) / applicable (base falls in it). */
  isActive: boolean
  /** Optional badge text shown in a chip next to the row (e.g., "✓ Sua faixa"). */
  badge?: string
}

interface Props {
  rows: TaxBracketRow[]
  /** Column header for the first column. */
  rangeHeader?: string
  /** Column header for the "rate" column. */
  rateHeader?: string
  /** Column header for the "base" column. */
  baseHeader?: string
  /** Column header for the "tax" column. */
  taxHeader?: string
  /** Footer total label (e.g., "Total INSS"). */
  totalLabel?: string
  /** Footer total value (formatted string). */
  totalValue?: string
}

withDefaults(defineProps<Props>(), {
  rangeHeader: "Faixa",
  rateHeader: "Alíquota",
  baseHeader: "Base",
  taxHeader: "Desconto",
  totalLabel: undefined,
  totalValue: undefined,
});
</script>

<template>
  <div class="tax-bracket-table">
    <table class="tax-bracket-table__table">
      <thead>
        <tr class="tax-bracket-table__header-row">
          <th class="tax-bracket-table__th tax-bracket-table__th--range">
            {{ rangeHeader }}
          </th>
          <th class="tax-bracket-table__th tax-bracket-table__th--rate">
            {{ rateHeader }}
          </th>
          <th class="tax-bracket-table__th tax-bracket-table__th--base">
            {{ baseHeader }}
          </th>
          <th class="tax-bracket-table__th tax-bracket-table__th--tax">
            {{ taxHeader }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="row in rows"
          :key="row.key"
          class="tax-bracket-table__row"
          :class="row.isActive
            ? 'tax-bracket-table__row--active'
            : 'tax-bracket-table__row--inactive'"
        >
          <td class="tax-bracket-table__td tax-bracket-table__td--range">
            {{ row.rangeLabel }}
            <span
              v-if="row.badge"
              class="tax-bracket-table__badge"
            >
              {{ row.badge }}
            </span>
          </td>
          <td class="tax-bracket-table__td">{{ row.rateLabel }}</td>
          <td class="tax-bracket-table__td">{{ row.baseLabel }}</td>
          <td class="tax-bracket-table__td tax-bracket-table__td--tax">
            {{ row.taxLabel }}
          </td>
        </tr>
      </tbody>

      <tfoot v-if="totalLabel">
        <tr class="tax-bracket-table__footer-row">
          <td
            colspan="3"
            class="tax-bracket-table__td tax-bracket-table__td--total-label"
          >
            {{ totalLabel }}
          </td>
          <td class="tax-bracket-table__td tax-bracket-table__td--total-value">
            {{ totalValue }}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
.tax-bracket-table {
  overflow-x: auto;
  border-radius: var(--radius-md, 8px);
  border: 1px solid var(--color-outline-subtle);
}

.tax-bracket-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-body-sm, 13px);
}

/* ── Header ─────────────────────────────────────────────────────────────────── */
.tax-bracket-table__header-row {
  background: var(--color-bg-elevated);
}

.tax-bracket-table__th {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  text-align: left;
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-xs, 11px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-outline-subtle);
  white-space: nowrap;
}

.tax-bracket-table__th--rate,
.tax-bracket-table__th--base,
.tax-bracket-table__th--tax {
  text-align: right;
}

/* ── Rows ────────────────────────────────────────────────────────────────────── */
.tax-bracket-table__row + .tax-bracket-table__row {
  border-top: 1px solid var(--color-outline-subtle);
}

.tax-bracket-table__row--inactive {
  opacity: 0.45;
}

.tax-bracket-table__row--active {
  background: var(--color-bg-base);
}

.tax-bracket-table__td {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  color: var(--color-text-primary);
  text-align: right;
  white-space: nowrap;
}

.tax-bracket-table__td--range {
  text-align: left;
  font-variant-numeric: tabular-nums;
}

.tax-bracket-table__td--tax {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-semantic-negative, #ef4444);
}

.tax-bracket-table__row--inactive .tax-bracket-table__td--tax {
  color: var(--color-text-muted);
  font-weight: normal;
}

/* ── Badge ───────────────────────────────────────────────────────────────────── */
.tax-bracket-table__badge {
  display: inline-block;
  margin-left: var(--space-1, 4px);
  padding: 1px 6px;
  border-radius: var(--border-radius-full, 9999px);
  background: var(--color-brand-100, #e0f2fe);
  color: var(--color-brand-700, #0369a1);
  font-size: var(--font-size-body-2xs, 10px);
  font-weight: var(--font-weight-semibold, 600);
  vertical-align: middle;
  white-space: nowrap;
}

/* ── Footer ──────────────────────────────────────────────────────────────────── */
.tax-bracket-table__footer-row {
  background: var(--color-bg-elevated);
  border-top: 2px solid var(--color-outline-soft);
}

.tax-bracket-table__td--total-label {
  text-align: left;
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-xs, 11px);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tax-bracket-table__td--total-value {
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-semantic-negative, #ef4444);
}
</style>
