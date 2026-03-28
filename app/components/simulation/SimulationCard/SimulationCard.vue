<script setup lang="ts">
import { NCard, NTag, NText, NStatistic, NButton, NSkeleton } from "naive-ui";
import { Trash2Icon } from "lucide-vue-next";
import { formatCurrency } from "~/utils/currency";
import type { SimulationCardProps, SimulationCardEmits } from "./SimulationCard.types";
import type { SimulationType } from "~/features/simulations/contracts/simulation-card.dto";

const props = defineProps<SimulationCardProps>();
const emit = defineEmits<SimulationCardEmits>();

/**
 * Resolves the NaiveUI tag type for a given simulation type.
 *
 * @param type - The simulation type value.
 * @returns NaiveUI tag type string.
 */
const typeTagType = (type: SimulationType): "info" | "success" | "warning" => {
  const map: Record<SimulationType, "info" | "success" | "warning"> = {
    installment_vs_cash: "info",
    goal_projection: "success",
    investment_return: "warning",
  };
  return map[type];
};

/**
 * Resolves a human-readable label for a given simulation type.
 *
 * @param type - The simulation type value.
 * @returns Localised label string in PT-BR.
 */
const typeLabel = (type: SimulationType): string => {
  const map: Record<SimulationType, string> = {
    installment_vs_cash: "Parcelamento × À vista",
    goal_projection: "Projeção de Meta",
    investment_return: "Retorno de Investimento",
  };
  return map[type];
};

/**
 * Formats an ISO date string to a localised PT-BR short date.
 *
 * @param value - ISO date string.
 * @returns Formatted date string like "31/12/2026".
 */
const formatDate = (value: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

/** Handles the delete button click. */
const onDelete = (): void => {
  emit("delete", props.simulation.id);
};
</script>

<template>
  <NCard
    :bordered="true"
    class="simulation-card"
    content-style="padding: var(--space-3);"
  >
    <template v-if="props.loading">
      <NSkeleton height="16px" width="70%" :sharp="false" />
      <NSkeleton height="14px" width="40%" :sharp="false" style="margin-top: 8px;" />
      <NSkeleton height="14px" width="55%" :sharp="false" style="margin-top: 6px;" />
      <NSkeleton height="36px" :sharp="false" style="margin-top: 12px;" />
    </template>

    <template v-else>
      <div class="simulation-card__header">
        <NText strong class="simulation-card__name">{{ props.simulation.name }}</NText>
        <NTag :type="typeTagType(props.simulation.type)" size="small" :bordered="false">
          {{ typeLabel(props.simulation.type) }}
        </NTag>
      </div>

      <NText class="simulation-card__summary" depth="3">
        {{ props.simulation.summary }}
      </NText>

      <div v-if="props.simulation.result_value !== null" class="simulation-card__result">
        <NStatistic
          label="Resultado principal"
          :value="formatCurrency(props.simulation.result_value)"
        />
      </div>
      <div v-else class="simulation-card__no-result">
        <NText depth="3" class="simulation-card__no-result-text">—</NText>
      </div>

      <div class="simulation-card__footer">
        <NText class="simulation-card__date" depth="3">
          Criado em {{ formatDate(props.simulation.created_at) }}
        </NText>
        <NButton
          size="small"
          quaternary
          :focusable="false"
          aria-label="Excluir simulação"
          @click="onDelete"
        >
          <template #icon>
            <Trash2Icon :size="16" />
          </template>
        </NButton>
      </div>
    </template>
  </NCard>
</template>

<style scoped>
.simulation-card {
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
}

.simulation-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  flex-wrap: wrap;
}

.simulation-card__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1 1 auto;
  min-width: 0;
}

.simulation-card__summary {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  display: block;
  margin-bottom: var(--space-2);
}

.simulation-card__result {
  margin-bottom: var(--space-2);
}

.simulation-card__no-result {
  margin-bottom: var(--space-2);
}

.simulation-card__no-result-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.simulation-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
  margin-top: auto;
}

.simulation-card__date {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
