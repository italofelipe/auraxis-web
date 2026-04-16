<script setup lang="ts">
import { NButton, NSpace, NThing } from "naive-ui";

import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import { BR_TAX_TABLE_YEAR } from "~/features/tools/model/hora-extra";

defineOptions({ name: "HoraExtraActions" });

defineProps<{
  savedSimulationId: string | null;
  isSaving: boolean;
  hasPremiumAccess: boolean;
  t: (key: string, vars?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  save: [];
  upgrade: [];
}>();
</script>

<template>
  <div class="hora-extra-actions">
    <UiSurfaceCard class="hora-extra-actions__bar">
      <NSpace vertical :size="8">
        <NButton
          block
          :loading="isSaving"
          :disabled="!!savedSimulationId || isSaving"
          @click="emit('save')"
        >
          {{ savedSimulationId ? t('horaExtra.actions.saved') : t('horaExtra.actions.save') }}
        </NButton>

        <NThing
          v-if="!hasPremiumAccess"
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
      <p class="hora-extra-actions__disclaimer">
        {{ t('horaExtra.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
      </p>
      <p class="hora-extra-actions__disclaimer">
        {{ t('horaExtra.disclaimer.irNotIncluded') }}
      </p>
    </UiSurfaceCard>
  </div>
</template>

<style scoped>
.hora-extra-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-actions__bar {
  display: flex;
  flex-direction: column;
}

.hora-extra-actions__disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1, 4px);
}
</style>
