<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NTag } from "naive-ui";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardUtilizationQuery } from "~/features/credit-cards/queries/use-credit-card-utilization-query";
import {
  utilizationBandClass,
  utilizationBarWidthPct,
} from "~/features/credit-cards/utils/utilization";
import { formatCurrency } from "~/utils/currency";

const props = withDefaults(defineProps<{
  card: CreditCardDto;
  selected?: boolean;
}>(), {
  selected: false,
});

const emit = defineEmits<{
  (event: "edit" | "delete" | "view-bill" | "select", card: CreditCardDto): void;
}>();

const { t } = useI18n();

const utilizationQuery = useCreditCardUtilizationQuery(() => props.card.id);

const hasUtilization = computed<boolean>(
  () => utilizationQuery.data.value !== undefined,
);
const pct = computed<number>(
  () => utilizationQuery.data.value?.utilizationPct ?? 0,
);
const committed = computed<number>(
  () => utilizationQuery.data.value?.committedAmount ?? 0,
);
const limit = computed<number | null>(
  () => utilizationQuery.data.value?.limitAmount ?? props.card.limit_amount,
);

const barClass = computed<string>(() => utilizationBandClass(pct.value));
const barWidth = computed<string>(
  () => `${utilizationBarWidthPct(pct.value)}%`,
);

const utilizationLabel = computed<string>(() => {
  const limitStr = limit.value !== null ? formatCurrency(limit.value) : "—";
  return t("pages.settings.creditCards.card.utilizationLabel", {
    pct: Math.round(pct.value),
    committed: formatCurrency(committed.value),
    limit: limitStr,
  });
});

const benefits = computed<readonly string[]>(
  () => props.card.benefits ?? [],
);

const limitLabel = computed<string>(() =>
  props.card.limit_amount !== null ? formatCurrency(props.card.limit_amount) : "Sem limite",
);

const cycleLabel = computed<string>(() => {
  if (!props.card.closing_day || !props.card.due_day) {
    return "Ciclo pendente";
  }
  return `Fecha dia ${props.card.closing_day} · Vence dia ${props.card.due_day}`;
});

/** Seleciona o cartão no hub sem acionar as ações rápidas. */
const select = (): void => {
  emit("select", props.card);
};
</script>

<template>
  <article
    class="cc-card"
    :class="{ 'cc-card--selected': props.selected }"
    data-testid="credit-card-card"
  >
    <header class="cc-card__header">
      <div class="cc-card__identity">
        <p class="cc-card__name">{{ props.card.name }}</p>
        <p class="cc-card__bank">{{ props.card.bank ?? "Banco não informado" }}</p>
      </div>
      <div class="cc-card__brand">
        <NTag v-if="props.card.brand" size="small" :bordered="false">
          {{ props.card.brand }}
        </NTag>
      </div>
    </header>

    <button
      class="cc-card__select"
      type="button"
      data-testid="cc-select-card"
      :aria-pressed="props.selected"
      @click="select"
    >
      {{ props.selected ? "Selecionado" : "Selecionar cartão" }}
    </button>

    <div class="cc-card__meta">
      <div>
        <span>Limite</span>
        <strong>{{ limitLabel }}</strong>
      </div>
      <div>
        <span>Ciclo</span>
        <strong>{{ cycleLabel }}</strong>
      </div>
    </div>

    <section v-if="hasUtilization" class="cc-card__util" data-testid="cc-util">
      <div class="cc-card__bar">
        <div
          class="cc-card__bar-fill"
          :class="barClass"
          :style="{ width: barWidth }"
          data-testid="cc-util-bar"
        />
      </div>
      <p class="cc-card__util-label">{{ utilizationLabel }}</p>
    </section>
    <p v-else class="cc-card__util-label cc-card__util-label--muted">
      Utilização carregando ou indisponível
    </p>

    <ul v-if="benefits.length" class="cc-card__benefits">
      <li v-for="benefit in benefits" :key="benefit">
        <NTag size="small" type="success" :bordered="false">{{ benefit }}</NTag>
      </li>
    </ul>
    <p v-else class="cc-card__empty-note">Sem benefícios cadastrados</p>

    <footer class="cc-card__actions">
      <NButton
        size="small"
        type="primary"
        data-testid="cc-view-bill"
        @click.stop="emit('view-bill', props.card)"
      >
        {{ t("pages.settings.creditCards.card.viewBill") }}
      </NButton>
      <NButton
        size="small"
        tertiary
        data-testid="cc-edit"
        @click.stop="emit('edit', props.card)"
      >
        {{ t("pages.settings.creditCards.edit") }}
      </NButton>
      <NButton
        size="small"
        tertiary
        type="error"
        data-testid="cc-delete"
        @click.stop="emit('delete', props.card)"
      >
        {{ t("pages.settings.creditCards.remove") }}
      </NButton>
    </footer>
  </article>
</template>

<style scoped>
.cc-card {
  display: flex;
  flex-direction: column;
  gap: 13px;
  padding: 16px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  background:
    linear-gradient(135deg, var(--color-brand-glow-xs), transparent 44%),
    var(--color-bg-elevated);
  box-shadow: 0 16px 48px color-mix(in srgb, var(--color-neutral-950) 12%, transparent);
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.cc-card:hover,
.cc-card:focus-within,
.cc-card--selected {
  border-color: color-mix(in srgb, var(--color-brand-500) 54%, transparent);
  box-shadow: 0 18px 64px var(--color-brand-glow-sm);
  transform: translateY(-1px);
}

.cc-card--selected {
  background:
    linear-gradient(135deg, var(--color-brand-glow-sm), var(--color-info-bg)),
    var(--color-bg-surface);
}

.cc-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.cc-card__select {
  width: 100%;
  min-height: 34px;
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 28%, transparent);
  border-radius: var(--radius-md);
  color: var(--color-brand-600);
  background: var(--color-brand-hover-surface);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.cc-card__select:hover,
.cc-card__select:focus-visible,
.cc-card--selected .cc-card__select {
  border-color: color-mix(in srgb, var(--color-brand-500) 58%, transparent);
  color: var(--color-brand-700);
  background: color-mix(in srgb, var(--color-brand-500) 14%, var(--color-bg-surface));
  outline: none;
}

.cc-card__identity {
  min-width: 0;
}

.cc-card__name {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-extrabold);
  line-height: 1.2;
}

.cc-card__bank,
.cc-card__empty-note {
  margin: 3px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.cc-card__brand {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.cc-card__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.cc-card__meta div {
  display: grid;
  gap: 5px;
  min-height: 70px;
  padding: 10px;
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-surface) 72%, transparent);
}

.cc-card__meta span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
  letter-spacing: 0;
}

.cc-card__meta strong {
  align-self: end;
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-family: "IBM Plex Mono", monospace;
  font-size: var(--font-size-xs);
  line-height: 1.25;
}

.cc-card__bar {
  width: 100%;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-outline-subtle);
  overflow: hidden;
}

.cc-card__bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.cc-util--low {
  background: var(--color-positive);
}

.cc-util--mid {
  background: var(--color-warning);
}

.cc-util--high {
  background: var(--color-negative);
}

.cc-card__util-label {
  margin: 7px 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.cc-card__util-label--muted {
  margin: 0;
  color: var(--color-text-muted);
}

.cc-card__benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cc-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.cc-card__actions :deep(.n-button:not(.n-button--primary-type):not(.n-button--error-type)) {
  color: var(--color-text-secondary);
}

.cc-card__actions :deep(.n-button--error-type) {
  color: var(--color-negative);
}

@media (prefers-reduced-motion: reduce) {
  .cc-card,
  .cc-card__select,
  .cc-card__bar-fill {
    transition: none;
  }
}
</style>
