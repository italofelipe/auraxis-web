<script setup lang="ts">
import { NButton, NSpace, NThing } from "naive-ui";

import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { BR_TAX_TABLE_YEAR } from "~/features/tools/model/thirteenth-salary";

defineOptions({ name: "ThirteenthSalaryActions" });

defineProps<{
  savedSimulationId: string | null;
  isSaving: boolean;
  isBridging: boolean;
  hasPremiumAccess: boolean;
  t: (key: string, vars?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  save: [];
  addToGoal: [];
  addToBudget: [];
  upgrade: [];
}>();
</script>

<template>
  <div class="thirteenth-salary-actions">
    <UiSurfaceCard class="thirteenth-salary-actions__bar">
      <NSpace vertical :size="8">
        <NButton
          block
          :loading="isSaving"
          :disabled="!!savedSimulationId || isBridging"
          @click="emit('save')"
        >
          {{ savedSimulationId ? t('thirteenthSalary.actions.saved') : t('thirteenthSalary.actions.save') }}
        </NButton>

        <template v-if="hasPremiumAccess">
          <NButton block type="primary" :disabled="isBridging" @click="emit('addToGoal')">
            {{ t('thirteenthSalary.actions.addToGoal') }}
          </NButton>
          <NButton block type="primary" :disabled="isBridging" @click="emit('addToBudget')">
            {{ t('thirteenthSalary.actions.addToBudget') }}
          </NButton>
        </template>

        <NThing
          v-else
          :title="t('thirteenthSalary.premiumCta.title')"
          :description="t('thirteenthSalary.premiumCta.description')"
        >
          <template #footer>
            <NButton size="small" type="warning" @click="emit('upgrade')">
              {{ t('thirteenthSalary.premiumCta.upgrade') }}
            </NButton>
          </template>
        </NThing>
      </NSpace>
    </UiSurfaceCard>

    <UiSurfaceCard>
      <p class="thirteenth-salary-actions__disclaimer">
        {{ t('thirteenthSalary.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
      </p>
      <p class="thirteenth-salary-actions__disclaimer">
        {{ t('thirteenthSalary.disclaimer.notFinancialAdvice') }}
      </p>
    </UiSurfaceCard>
  </div>
</template>

<style scoped>
.thirteenth-salary-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-actions__bar {
  display: flex;
  flex-direction: column;
}

.thirteenth-salary-actions__disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1);
}
</style>
