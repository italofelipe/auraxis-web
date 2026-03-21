<script setup lang="ts">
import { computed } from "vue";
import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
} from "naive-ui";

import UiInfoTooltip from "~/shared/components/UiInfoTooltip/UiInfoTooltip.vue";
import { INSTALLMENT_VS_CASH_TOOLTIP_COPY } from "~/features/tools/model/installment-vs-cash-tooltips";
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

const opportunityRateOptions = [
  { label: "Manual", value: "manual" satisfies OpportunityRateType },
  {
    label: "Preset do produto",
    value: "product_default" satisfies OpportunityRateType,
  },
  {
    label: "Usar só inflação",
    value: "inflation_only" satisfies OpportunityRateType,
  },
];

const delayOptions = [
  { label: "Hoje", value: "today" satisfies InstallmentDelayPreset },
  { label: "30 dias", value: "30_days" satisfies InstallmentDelayPreset },
  { label: "45 dias", value: "45_days" satisfies InstallmentDelayPreset },
  { label: "Personalizar", value: "custom" satisfies InstallmentDelayPreset },
];

const installmentInputOptions = [
  { label: "Informar valor total parcelado", value: "total" satisfies InstallmentInputMode },
  { label: "Informar valor de cada parcela", value: "amount" satisfies InstallmentInputMode },
] as const;

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
    <NFormItem label="Compra ou cenário">
      <NInput
        :value="props.modelValue.scenarioLabel"
        placeholder="Ex.: notebook, geladeira, viagem"
        clearable
        @update:value="(value: string) => patchForm({ scenarioLabel: value })"
      />
    </NFormItem>

    <div class="installment-vs-cash-form__grid">
      <NFormItem label="Preço à vista">
        <NInputNumber
          :value="props.modelValue.cashPrice"
          :min="0"
          :precision="2"
          :show-button="false"
          placeholder="900,00"
          @update:value="(value: number | null) => patchForm({ cashPrice: value })"
        />
      </NFormItem>

      <NFormItem label="Quantidade de parcelas">
        <NInputNumber
          :value="props.modelValue.installmentCount"
          :min="1"
          :max="60"
          :show-button="false"
          placeholder="6"
          @update:value="(value: number | null) => patchForm({ installmentCount: value })"
        />
      </NFormItem>
    </div>

    <NFormItem label="Como você quer informar o parcelado">
      <UiSegmentedControl
        :model-value="props.modelValue.installmentInputMode"
        :options="[...installmentInputOptions]"
        aria-label="Modo do parcelamento"
        @update:model-value="(value: InstallmentInputMode) => patchForm({ installmentInputMode: value })"
      />
    </NFormItem>

    <NFormItem
      v-if="props.modelValue.installmentInputMode === 'total'"
      label="Valor total parcelado"
    >
      <NInputNumber
        :value="props.modelValue.installmentTotal"
        :min="0"
        :precision="2"
        :show-button="false"
        placeholder="990,00"
        @update:value="(value: number | null) => patchForm({ installmentTotal: value })"
      />
    </NFormItem>

    <NFormItem
      v-else
      label="Valor de cada parcela"
    >
      <NInputNumber
        :value="props.modelValue.installmentAmount"
        :min="0"
        :precision="2"
        :show-button="false"
        placeholder="165,00"
        @update:value="(value: number | null) => patchForm({ installmentAmount: value })"
      />
    </NFormItem>

    <div class="installment-vs-cash-form__grid">
      <NFormItem>
        <template #label>
          <span class="installment-vs-cash-form__label">
            Primeira parcela
            <UiInfoTooltip
              label="Entender primeira parcela"
              :content="INSTALLMENT_VS_CASH_TOOLTIP_COPY.firstPaymentDelay"
            />
          </span>
        </template>
        <NSelect
          :value="props.modelValue.firstPaymentDelayPreset"
          :options="delayOptions"
          @update:value="(value: InstallmentDelayPreset) => patchForm({ firstPaymentDelayPreset: value })"
        />
      </NFormItem>

      <NFormItem v-if="shouldShowCustomDelay" label="Dias até a primeira parcela">
        <NInputNumber
          :value="props.modelValue.customFirstPaymentDelayDays"
          :min="0"
          :max="3650"
          :show-button="false"
          placeholder="75"
          @update:value="(value: number | null) => patchForm({ customFirstPaymentDelayDays: value })"
        />
      </NFormItem>
    </div>

    <div class="installment-vs-cash-form__grid">
      <NFormItem>
        <template #label>
          <span class="installment-vs-cash-form__label">
            Taxa de oportunidade
            <UiInfoTooltip
              label="Entender taxa de oportunidade"
              :content="INSTALLMENT_VS_CASH_TOOLTIP_COPY.opportunityRate"
            />
          </span>
        </template>
        <NSelect
          :value="props.modelValue.opportunityRateType"
          :options="opportunityRateOptions"
          @update:value="(value: OpportunityRateType) => patchForm({ opportunityRateType: value })"
        />
      </NFormItem>

      <NFormItem>
        <template #label>
          <span class="installment-vs-cash-form__label">
            Inflação anual (%)
            <UiInfoTooltip
              label="Entender inflacao anual"
              :content="INSTALLMENT_VS_CASH_TOOLTIP_COPY.inflation"
            />
          </span>
        </template>
        <NInputNumber
          :value="props.modelValue.inflationRateAnnual"
          :min="0"
          :precision="2"
          :show-button="false"
          placeholder="4,50"
          @update:value="(value: number | null) => patchForm({ inflationRateAnnual: value })"
        />
      </NFormItem>
    </div>

    <NFormItem v-if="shouldShowManualOpportunityRate" label="Taxa de oportunidade anual (%)">
      <NInputNumber
        :value="props.modelValue.opportunityRateAnnual"
        :min="0"
        :precision="2"
        :show-button="false"
        placeholder="12,00"
        @update:value="(value: number | null) => patchForm({ opportunityRateAnnual: value })"
      />
    </NFormItem>

    <NFormItem>
      <template #label>
        <span class="installment-vs-cash-form__label">
          Custos extras iniciais
          <UiInfoTooltip
            label="Entender custos extras"
            :content="INSTALLMENT_VS_CASH_TOOLTIP_COPY.extraFees"
          />
        </span>
      </template>
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
          placeholder="60,00"
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
      Calcular agora
    </NButton>
  </NForm>
</template>

<style scoped>
.installment-vs-cash-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.installment-vs-cash-form__label {
  display: inline-flex;
  align-items: center;
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
