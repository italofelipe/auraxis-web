<script setup lang="ts">
import { computed } from "vue";
import { NButton, NTag } from "naive-ui";

interface Props {
  isAuthenticated: boolean;
  hasPremiumAccess: boolean;
  isSaving: boolean;
  isBridging: boolean;
  hasSavedSimulation: boolean;
}

interface Emits {
  (event: "save" | "goal" | "expense"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Returns the helper label shown next to the premium CTA cluster.
 *
 * @returns PT-BR helper copy.
 */
const premiumLabel = computed<string>(() => {
  if (!props.isAuthenticated) {
    return "Faça login para desbloquear meta e despesa planejada.";
  }
  if (!props.hasPremiumAccess) {
    return "Recurso premium: inclua a simulação em metas ou despesas planejadas.";
  }
  return "Sua conta premium pode transformar esta simulação em meta ou despesa.";
});

/**
 * Whether save or bridge actions should be disabled by network activity.
 *
 * @returns True when an action is currently in flight.
 */
const isBusy = computed<boolean>(() => {
  return props.isSaving || props.isBridging;
});
</script>

<template>
  <div class="installment-vs-cash-action-bar">
    <div class="installment-vs-cash-action-bar__primary">
      <NButton
        type="primary"
        size="large"
        :loading="props.isSaving"
        :disabled="isBusy"
        @click="emit('save')"
      >
        {{ props.hasSavedSimulation ? "Simulação salva" : "Salvar simulação" }}
      </NButton>

      <NTag
        v-if="props.hasSavedSimulation"
        size="small"
        round
        type="success"
      >
        Pronta para reaproveitar
      </NTag>
    </div>

    <div class="installment-vs-cash-action-bar__secondary">
      <NButton
        type="default"
        size="medium"
        ghost
        :loading="props.isBridging"
        :disabled="isBusy"
        @click="emit('goal')"
      >
        Incluir em meta
      </NButton>

      <NButton
        type="default"
        size="medium"
        ghost
        :loading="props.isBridging"
        :disabled="isBusy"
        @click="emit('expense')"
      >
        Planejar despesa
      </NButton>
    </div>

    <span class="installment-vs-cash-action-bar__hint">
      {{ premiumLabel }}
    </span>
  </div>
</template>

<style scoped>
.installment-vs-cash-action-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.installment-vs-cash-action-bar__primary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.installment-vs-cash-action-bar__secondary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.installment-vs-cash-action-bar__hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
</style>
