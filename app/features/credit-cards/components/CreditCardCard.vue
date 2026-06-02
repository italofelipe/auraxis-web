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

/**
 * Card rico de cartão de crédito (cc-4 / #864): cabeçalho + barra de utilização
 * colorida por faixa, benefícios, validade e atalho para a fatura. Busca a
 * utilização do ciclo atual sozinho via Vue Query.
 */
const props = defineProps<{ card: CreditCardDto }>();

const emit = defineEmits<{
  (event: "edit" | "delete" | "view-bill", card: CreditCardDto): void;
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
  props.card.last_four_digits ? `•••• ${props.card.last_four_digits}` : "",
);
</script>

<template>
  <div class="cc-card" data-testid="credit-card-card">
    <header class="cc-card__header">
      <div>
        <h3 class="cc-card__name">{{ props.card.name }}</h3>
        <p v-if="props.card.bank" class="cc-card__bank">{{ props.card.bank }}</p>
      </div>
      <div class="cc-card__brand">
        <NTag v-if="props.card.brand" size="small" :bordered="false">
          {{ props.card.brand }}
        </NTag>
        <span class="cc-card__digits">{{ maskedDigits }}</span>
      </div>
    </header>

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

    <ul v-if="benefits.length" class="cc-card__benefits">
      <li v-for="benefit in benefits" :key="benefit">
        <NTag size="small" type="success" :bordered="false">{{ benefit }}</NTag>
      </li>
    </ul>

    <p v-if="validityLabel" class="cc-card__validity">
      {{ t("pages.settings.creditCards.card.validity") }}: {{ validityLabel }}
    </p>

    <footer class="cc-card__actions">
      <NButton
        size="small"
        type="primary"
        data-testid="cc-view-bill"
        @click="emit('view-bill', props.card)"
      >
        {{ t("pages.settings.creditCards.card.viewBill") }}
      </NButton>
      <NButton size="small" tertiary @click="emit('edit', props.card)">
        {{ t("pages.settings.creditCards.edit") }}
      </NButton>
      <NButton size="small" tertiary type="error" @click="emit('delete', props.card)">
        {{ t("pages.settings.creditCards.remove") }}
      </NButton>
    </footer>
  </div>
</template>

<style scoped>
.cc-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}

.cc-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
}

.cc-card__name {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.cc-card__bank {
  margin: 0;
  font-size: var(--font-size-xs);
  opacity: 0.7;
}

.cc-card__brand {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.cc-card__digits {
  font-size: var(--font-size-xs);
  opacity: 0.7;
}

.cc-card__bar {
  width: 100%;
  height: 8px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  overflow: hidden;
}

.cc-card__bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.cc-util--low {
  background: var(--color-success);
}

.cc-util--mid {
  background: var(--color-warning);
}

.cc-util--high {
  background: var(--color-error);
}

.cc-card__util-label {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-xs);
}

.cc-card__benefits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.cc-card__validity {
  margin: 0;
  font-size: var(--font-size-xs);
  opacity: 0.8;
}

.cc-card__actions {
  display: flex;
  gap: var(--space-1);
  margin-top: var(--space-1);
}
</style>
