<script setup lang="ts">
import { computed, reactive } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NDynamicTags,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
} from "naive-ui";

import {
  CREDIT_CARD_BENEFITS_MAX,
  type CreateCreditCardPayload,
  type CreditCardBrand,
  type CreditCardDto,
} from "~/features/credit-cards/contracts/credit-card.dto";

/**
 * Formulário de criação/edição de cartão (cc-4 / #864). Substitui o form inline
 * da página de settings; valida no client espelhando o Marshmallow do backend.
 */
const props = defineProps<{
  card?: CreditCardDto | null;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (event: "submit", payload: CreateCreditCardPayload): void;
  (event: "cancel"): void;
}>();

const { t } = useI18n();

const BRAND_NONE = "__none__";
const brandOptions = computed(() => [
  { value: BRAND_NONE, label: t("pages.settings.creditCards.fields.brandNone") },
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "hipercard", label: "Hipercard" },
  { value: "amex", label: "Amex" },
  { value: "other", label: t("pages.settings.creditCards.fields.brandOther") },
]);

const form = reactive({
  name: props.card?.name ?? "",
  brand: (props.card?.brand ?? BRAND_NONE) as string,
  bank: props.card?.bank ?? "",
  description: props.card?.description ?? "",
  limitAmount: props.card?.limit_amount ?? null,
  closingDay: props.card?.closing_day ?? null,
  dueDay: props.card?.due_day ?? null,
  benefits: [...(props.card?.benefits ?? [])] as string[],
});

const nameError = computed<boolean>(() => form.name.trim().length === 0);

const canSubmit = computed<boolean>(
  () =>
    !nameError.value &&
    form.benefits.length <= CREDIT_CARD_BENEFITS_MAX &&
    !props.submitting,
);

/**
 *
 */
const onSubmit = (): void => {
  if (!canSubmit.value) {
    return;
  }
  const brand: CreditCardBrand | null =
    form.brand === BRAND_NONE ? null : (form.brand as CreditCardBrand);
  emit("submit", {
    name: form.name.trim(),
    brand,
    bank: form.bank.trim() || null,
    description: form.description.trim() || null,
    limit_amount: form.limitAmount,
    closing_day: form.closingDay,
    due_day: form.dueDay,
    benefits: form.benefits.length ? form.benefits : null,
  });
};
</script>

<template>
  <NForm data-testid="credit-card-form" class="cc-form" @submit.prevent="onSubmit">
    <div class="cc-form__grid">
      <NFormItem
        :label="t('pages.settings.creditCards.fields.name')"
        :validation-status="nameError ? 'error' : undefined"
      >
        <NInput
          v-model:value="form.name"
          placeholder="Ex.: Cartão Inter"
          data-testid="cc-name"
        />
      </NFormItem>

      <NFormItem :label="t('pages.settings.creditCards.fields.bank')">
        <NInput v-model:value="form.bank" placeholder="Ex.: Banco Inter" />
      </NFormItem>

      <NFormItem :label="t('pages.settings.creditCards.fields.brand')">
        <NSelect
          v-model:value="form.brand"
          :options="brandOptions"
          placeholder="Selecione a bandeira"
        />
      </NFormItem>

      <NFormItem :label="t('pages.settings.creditCards.fields.limitAmount')">
        <UiMoneyInput v-model:value="form.limitAmount" placeholder="0,00" :min="0" />
      </NFormItem>

      <NFormItem :label="t('pages.settings.creditCards.fields.closingDay')">
        <NInputNumber
          v-model:value="form.closingDay"
          placeholder="Ex.: 5"
          :min="1"
          :max="31"
        />
      </NFormItem>

      <NFormItem :label="t('pages.settings.creditCards.fields.dueDay')">
        <NInputNumber
          v-model:value="form.dueDay"
          placeholder="Ex.: 12"
          :min="1"
          :max="31"
        />
      </NFormItem>
    </div>

    <NFormItem :label="t('pages.settings.creditCards.fields.benefits')">
      <NDynamicTags v-model:value="form.benefits" :max="CREDIT_CARD_BENEFITS_MAX" />
    </NFormItem>

    <NFormItem :label="t('pages.settings.creditCards.fields.description')">
      <NInput
        v-model:value="form.description"
        type="textarea"
        placeholder="Ex.: Cartão para compras recorrentes e assinaturas"
        :rows="2"
      />
    </NFormItem>

    <div class="cc-form__actions">
      <NButton tertiary @click="emit('cancel')">
        {{ t("pages.settings.creditCards.cancel") }}
      </NButton>
      <NButton
        type="primary"
        :disabled="!canSubmit"
        :loading="props.submitting"
        data-testid="cc-submit"
        @click="onSubmit"
      >
        {{ props.card ? t("pages.settings.creditCards.save") : t("pages.settings.creditCards.create") }}
      </NButton>
    </div>
  </NForm>
</template>

<style scoped>
.cc-form {
  max-height: calc(100dvh - 160px);
  overflow: auto;
  padding-right: 2px;
}

.cc-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 var(--space-3);
}

.cc-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

@media (max-width: 640px) {
  .cc-form {
    max-height: calc(100dvh - 132px);
  }

  .cc-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
