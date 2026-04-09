<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
} from "naive-ui";

import type {
  InstallmentDelayPreset,
  InstallmentVsCashFormState,
  InstallmentInputMode,
  OpportunityRateType,
} from "~/features/tools/model/installment-vs-cash";

interface Props {
  modelValue: InstallmentVsCashFormState;
  loading: boolean;
}

interface Emits {
  (event: "update:modelValue", value: InstallmentVsCashFormState): void;
  (event: "submit"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { t } = useI18n();

const opportunityRateOptions = computed(() => [
  { label: t("pages.installmentVsCash.form.opportunityRateOptions.manual"), value: "manual" satisfies OpportunityRateType },
  { label: t("pages.installmentVsCash.form.opportunityRateOptions.productDefault"), value: "product_default" satisfies OpportunityRateType },
  { label: t("pages.installmentVsCash.form.opportunityRateOptions.inflationOnly"), value: "inflation_only" satisfies OpportunityRateType },
]);

const delayOptions = computed(() => [
  { label: t("pages.installmentVsCash.form.delayOptions.today"), value: "today" satisfies InstallmentDelayPreset },
  { label: t("pages.installmentVsCash.form.delayOptions.thirtyDays"), value: "30_days" satisfies InstallmentDelayPreset },
  { label: t("pages.installmentVsCash.form.delayOptions.fortyFiveDays"), value: "45_days" satisfies InstallmentDelayPreset },
  { label: t("pages.installmentVsCash.form.delayOptions.custom"), value: "custom" satisfies InstallmentDelayPreset },
]);

const installmentInputOptions = computed(() => [
  { label: t("pages.installmentVsCash.form.installmentInputOptions.total"), value: "total" satisfies InstallmentInputMode },
  { label: t("pages.installmentVsCash.form.installmentInputOptions.amount"), value: "amount" satisfies InstallmentInputMode },
]);

/**
 * Emits a shallow form patch while preserving the remaining state.
 *
 * @param patch Partial state update.
 */
const patchForm = (patch: Partial<InstallmentVsCashFormState>): void => {
  emit("update:modelValue", {
    ...props.modelValue,
    ...patch,
  });
};

/**
 * Whether the manual opportunity-rate field should be visible.
 *
 * @returns True when the manual option is selected.
 */
const shouldShowManualOpportunityRate = computed<boolean>(() => {
  return props.modelValue.opportunityRateType === "manual";
});

/**
 * Whether the custom delay field should be visible.
 *
 * @returns True when the custom delay preset is selected.
 */
const shouldShowCustomDelay = computed<boolean>(() => {
  return props.modelValue.firstPaymentDelayPreset === "custom";
});

/**
 * Whether the upfront-fees field should be visible.
 *
 * @returns True when extra fees are enabled.
 */
const shouldShowFeesInput = computed<boolean>(() => {
  return props.modelValue.feesEnabled;
});
</script>

<template>
  <NForm
    class="installment-vs-cash-form"
    label-placement="top"
    @submit.prevent="emit('submit')"
  >
    <NFormItem :label="$t('pages.installmentVsCash.form.labels.scenario')">
      <NInput
        :value="props.modelValue.scenarioLabel"
        :placeholder="$t('pages.installmentVsCash.form.placeholders.scenario')"
        clearable
        @update:value="(value: string) => patchForm({ scenarioLabel: value })"
      />
    </NFormItem>

    <div class="installment-vs-cash-form__grid">
      <NFormItem :label="$t('pages.installmentVsCash.form.labels.cashPrice')">
        <NInputNumber
          :value="props.modelValue.cashPrice"
          :min="0"
          :precision="2"
          :show-button="false"
          :placeholder="$t('pages.installmentVsCash.form.placeholders.cashPrice')"
          @update:value="(value: number | null) => patchForm({ cashPrice: value })"
        />
      </NFormItem>

      <NFormItem :label="$t('pages.installmentVsCash.form.labels.installmentCount')">
        <NInputNumber
          :value="props.modelValue.installmentCount"
          :min="1"
          :max="60"
          :show-button="false"
          :placeholder="$t('pages.installmentVsCash.form.placeholders.installmentCount')"
          @update:value="(value: number | null) => patchForm({ installmentCount: value })"
        />
      </NFormItem>
    </div>

    <NFormItem :label="$t('pages.installmentVsCash.form.labels.installmentInputMode')">
      <UiSegmentedControl
        :model-value="props.modelValue.installmentInputMode"
        :options="installmentInputOptions"
        :aria-label="$t('pages.installmentVsCash.form.labels.installmentInputAriaLabel')"
        @update:model-value="(value: string) => patchForm({ installmentInputMode: value as InstallmentInputMode })"
      />
    </NFormItem>

    <NFormItem
      v-if="props.modelValue.installmentInputMode === 'total'"
      :label="$t('pages.installmentVsCash.form.labels.installmentTotal')"
    >
      <NInputNumber
        :value="props.modelValue.installmentTotal"
        :min="0"
        :precision="2"
        :show-button="false"
        :placeholder="$t('pages.installmentVsCash.form.placeholders.installmentTotal')"
        @update:value="(value: number | null) => patchForm({ installmentTotal: value })"
      />
    </NFormItem>

    <NFormItem
      v-else
      :label="$t('pages.installmentVsCash.form.labels.installmentAmount')"
    >
      <NInputNumber
        :value="props.modelValue.installmentAmount"
        :min="0"
        :precision="2"
        :show-button="false"
        :placeholder="$t('pages.installmentVsCash.form.placeholders.installmentAmount')"
        @update:value="(value: number | null) => patchForm({ installmentAmount: value })"
      />
    </NFormItem>

    <div class="installment-vs-cash-form__grid">
      <NFormItem :label="$t('pages.installmentVsCash.form.labels.firstPayment')">
        <NSelect
          :value="props.modelValue.firstPaymentDelayPreset"
          :options="delayOptions"
          @update:value="(value: InstallmentDelayPreset) => patchForm({ firstPaymentDelayPreset: value })"
        />
      </NFormItem>

      <NFormItem v-if="shouldShowCustomDelay" :label="$t('pages.installmentVsCash.form.labels.customDelay')">
        <NInputNumber
          :value="props.modelValue.customFirstPaymentDelayDays"
          :min="0"
          :max="3650"
          :show-button="false"
          :placeholder="$t('pages.installmentVsCash.form.placeholders.customDelay')"
          @update:value="(value: number | null) => patchForm({ customFirstPaymentDelayDays: value })"
        />
      </NFormItem>
    </div>

    <div class="installment-vs-cash-form__grid">
      <NFormItem :label="$t('pages.installmentVsCash.form.labels.opportunityRate')">
        <NSelect
          :value="props.modelValue.opportunityRateType"
          :options="opportunityRateOptions"
          @update:value="(value: OpportunityRateType) => patchForm({ opportunityRateType: value })"
        />
      </NFormItem>

      <NFormItem :label="$t('pages.installmentVsCash.form.labels.inflationRate')">
        <NInputNumber
          :value="props.modelValue.inflationRateAnnual"
          :min="0"
          :precision="2"
          :show-button="false"
          :placeholder="$t('pages.installmentVsCash.form.placeholders.inflationRate')"
          @update:value="(value: number | null) => patchForm({ inflationRateAnnual: value })"
        />
      </NFormItem>
    </div>

    <NFormItem v-if="shouldShowManualOpportunityRate" :label="$t('pages.installmentVsCash.form.labels.manualRate')">
      <NInputNumber
        :value="props.modelValue.opportunityRateAnnual"
        :min="0"
        :precision="2"
        :show-button="false"
        :placeholder="$t('pages.installmentVsCash.form.placeholders.manualRate')"
        @update:value="(value: number | null) => patchForm({ opportunityRateAnnual: value })"
      />
    </NFormItem>

    <NFormItem :label="$t('pages.installmentVsCash.form.labels.fees')">
      <div class="installment-vs-cash-form__fees">
        <NSwitch
          :value="props.modelValue.feesEnabled"
          @update:value="(value: boolean) => patchForm({ feesEnabled: value, feesUpfront: value ? props.modelValue.feesUpfront : null })"
        />

        <NInputNumber
          v-if="shouldShowFeesInput"
          :value="props.modelValue.feesUpfront"
          :min="0"
          :precision="2"
          :show-button="false"
          :placeholder="$t('pages.installmentVsCash.form.placeholders.fees')"
          @update:value="(value: number | null) => patchForm({ feesUpfront: value })"
        />
      </div>
    </NFormItem>

    <NButton
      type="primary"
      size="large"
      attr-type="submit"
      :loading="props.loading"
      :disabled="props.loading"
      class="installment-vs-cash-form__submit"
    >
      {{ $t('pages.installmentVsCash.form.actions.calculate') }}
    </NButton>
  </NForm>
</template>

<style scoped>
.installment-vs-cash-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.installment-vs-cash-form__grid {
  display: grid;
  gap: var(--space-2);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.installment-vs-cash-form__fees {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.installment-vs-cash-form__submit {
  margin-top: var(--space-2);
}

@media (max-width: 767px) {
  .installment-vs-cash-form__grid {
    grid-template-columns: 1fr;
  }

  .installment-vs-cash-form__fees {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
