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

const validityLabel = computed<string | null>(() => {
  const raw = props.card.validity_date;
  if (!raw) {
    return null;
  }
  const [year, month] = raw.split("-");
  return year && month ? `${month}/${year}` : raw;
});

const maskedDigits = computed<string>(() =>
  props.card.last_four_digits ? `•••• ${props.card.last_four_digits}` : "Final não informado",
);

const limitLabel = computed<string>(() =>
  props.card.limit_amount !== null ? formatCurrency(props.card.limit_amount) : "Sem limite",
);

const cycleLabel = computed<string>(() => {
  if (!props.card.closing_day || !props.card.due_day) {
    return "Ciclo pendente";
  }
  return `Fecha ${props.card.closing_day} · vence ${props.card.due_day}`;
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
        <span class="cc-card__digits">{{ maskedDigits }}</span>
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

    <p v-if="validityLabel" class="cc-card__validity">
      {{ t("pages.settings.creditCards.card.validity") }}: {{ validityLabel }}
    </p>

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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  color: #d2dcf3;
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.08), transparent 40%),
    #0e1523;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.cc-card:hover,
.cc-card:focus-within,
.cc-card--selected {
  border-color: rgba(68, 212, 255, 0.45);
  box-shadow: 0 20px 70px rgba(68, 212, 255, 0.12);
  transform: translateY(-1px);
}

.cc-card--selected {
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.16), rgba(139, 125, 255, 0.1)),
    #121a2a;
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
  border: 1px solid rgba(68, 212, 255, 0.22);
  border-radius: var(--radius-md);
  color: #b7f5ff;
  background: rgba(68, 212, 255, 0.08);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.cc-card__select:hover,
.cc-card__select:focus-visible,
.cc-card--selected .cc-card__select {
  border-color: rgba(68, 212, 255, 0.48);
  color: #eefcff;
  background: rgba(68, 212, 255, 0.16);
  outline: none;
}

.cc-card__identity {
  min-width: 0;
}

.cc-card__name {
  margin: 0;
  overflow-wrap: anywhere;
  color: #f1f5ff;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-extrabold);
  line-height: 1.2;
}

.cc-card__bank,
.cc-card__digits,
.cc-card__empty-note {
  margin: 3px 0 0;
  color: #94a3bf;
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
}

.cc-card__meta span {
  color: #94a3bf;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
  letter-spacing: 0;
}

.cc-card__meta strong {
  align-self: end;
  overflow-wrap: anywhere;
  color: #f1f5ff;
  font-family: "IBM Plex Mono", monospace;
  font-size: var(--font-size-xs);
  line-height: 1.25;
}

.cc-card__bar {
  width: 100%;
  height: 8px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.cc-card__bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.cc-util--low {
  background: #42e8a9;
}

.cc-util--mid {
  background: #ffb861;
}

.cc-util--high {
  background: #ff6f79;
}

.cc-card__util-label {
  margin: 7px 0 0;
  color: #d2dcf3;
  font-size: var(--font-size-xs);
}

.cc-card__util-label--muted {
  margin: 0;
  color: #94a3bf;
}

.cc-card__benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cc-card__validity {
  margin: 0;
  color: #94a3bf;
  font-size: var(--font-size-xs);
}

.cc-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.cc-card__actions :deep(.n-button:not(.n-button--primary-type):not(.n-button--error-type)) {
  color: #d2dcf3;
}

.cc-card__actions :deep(.n-button--error-type) {
  color: #ff6b7a;
}
</style>
