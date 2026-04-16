<script setup lang="ts">
import { NAlert, NSpace, NTag, NThing } from "naive-ui";

import type { InstallmentVsCashFormState } from "~/features/tools/model/installment-vs-cash";

defineOptions({ name: "InstallmentVsCashHero" });

defineProps<{
  form: InstallmentVsCashFormState;
  validationMessage: string | null;
  isLoading: boolean;
  isError: boolean;
  t: (key: string, vars?: Record<string, unknown>) => string;
}>();

const emit = defineEmits<{
  "update:form": [value: InstallmentVsCashFormState];
  submit: [];
}>();
</script>

<template>
  <section class="installment-vs-cash-hero">
    <div class="installment-vs-cash-hero__copy">
      <NTag round type="warning">
        {{ t('pages.installmentVsCash.hero.badge') }}
      </NTag>
      <UiPageHeader
        :title="t('pages.installmentVsCash.hero.title')"
        :subtitle="t('pages.installmentVsCash.hero.subtitle')"
      />

      <NSpace vertical :size="16">
        <NThing
          :title="t('pages.installmentVsCash.hero.featureBasic')"
          :description="t('pages.installmentVsCash.hero.featureBasicDesc')"
        />
        <NThing
          :title="t('pages.installmentVsCash.hero.featureAdvanced')"
          :description="t('pages.installmentVsCash.hero.featureAdvancedDesc')"
        />
      </NSpace>
    </div>

    <UiGlassPanel glow class="installment-vs-cash-hero__panel">
      <InstallmentVsCashCalculatorForm
        :model-value="form"
        :loading="isLoading"
        @update:model-value="(v: InstallmentVsCashFormState) => emit('update:form', v)"
        @submit="emit('submit')"
      />

      <NAlert v-if="validationMessage" type="warning" class="installment-vs-cash-hero__alert">
        {{ validationMessage }}
      </NAlert>

      <NAlert v-if="isError" type="error" class="installment-vs-cash-hero__alert">
        {{ t('pages.installmentVsCash.errors.calculate') }}
      </NAlert>
    </UiGlassPanel>
  </section>
</template>

<style scoped>
.installment-vs-cash-hero {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
  align-items: start;
}

.installment-vs-cash-hero__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-5);
}

.installment-vs-cash-hero__panel {
  position: sticky;
  top: var(--space-3);
}

.installment-vs-cash-hero__alert {
  margin-top: var(--space-2);
}

@media (max-width: 1023px) {
  .installment-vs-cash-hero {
    grid-template-columns: 1fr;
  }

  .installment-vs-cash-hero__copy {
    padding-top: var(--space-2);
  }

  .installment-vs-cash-hero__panel {
    position: static;
  }
}
</style>
