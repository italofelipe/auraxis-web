<script setup lang="ts">
import { h, type VNodeChild } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  type DataTableColumns,
} from "naive-ui";

import type { CreditCardBrand, CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateCreditCardMutation } from "~/features/credit-cards/queries/use-create-credit-card-mutation";
import { useUpdateCreditCardMutation } from "~/features/credit-cards/queries/use-update-credit-card-mutation";
import { useDeleteCreditCardMutation } from "~/features/credit-cards/queries/use-delete-credit-card-mutation";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Cartões de Crédito",
  pageSubtitle: "Gerencie seus cartões de crédito",
});

useHead({ title: "Cartões de Crédito | Auraxis" });

const { data: creditCards, isLoading } = useCreditCardsQuery();
const createMutation = useCreateCreditCardMutation();
const updateMutation = useUpdateCreditCardMutation();
const deleteMutation = useDeleteCreditCardMutation();

const BRAND_NONE_SENTINEL = "__none__";
type BrandSelectValue = CreditCardBrand | typeof BRAND_NONE_SENTINEL;

const showModal = ref(false);
const editingCard = ref<CreditCardDto | null>(null);
const formName = ref("");
const formBrand = ref<BrandSelectValue>(BRAND_NONE_SENTINEL);
const formLimitAmount = ref<number | null>(null);
const formClosingDay = ref<number | null>(null);
const formDueDay = ref<number | null>(null);
const formLastFourDigits = ref<string>("");

const BRAND_OPTIONS = computed(() => [
  { value: BRAND_NONE_SENTINEL, label: t("pages.settings.creditCards.fields.brandNone") },
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "elo", label: "Elo" },
  { value: "hipercard", label: "Hipercard" },
  { value: "amex", label: "American Express" },
  { value: "other", label: t("pages.settings.creditCards.fields.brandOther") },
]);

/**
 *
 */
function openCreate(): void {
  editingCard.value = null;
  formName.value = "";
  formBrand.value = BRAND_NONE_SENTINEL;
  formLimitAmount.value = null;
  formClosingDay.value = null;
  formDueDay.value = null;
  formLastFourDigits.value = "";
  showModal.value = true;
}

/**
 *
 * @param card
 */
function openEdit(card: CreditCardDto): void {
  editingCard.value = card;
  formName.value = card.name;
  formBrand.value = card.brand ?? BRAND_NONE_SENTINEL;
  formLimitAmount.value = card.limit_amount;
  formClosingDay.value = card.closing_day;
  formDueDay.value = card.due_day;
  formLastFourDigits.value = card.last_four_digits ?? "";
  showModal.value = true;
}

/**
 *
 */
function closeModal(): void {
  showModal.value = false;
  formName.value = "";
  formBrand.value = BRAND_NONE_SENTINEL;
  formLimitAmount.value = null;
  formClosingDay.value = null;
  formDueDay.value = null;
  formLastFourDigits.value = "";
  editingCard.value = null;
}

/**
 *
 */
async function submitForm(): Promise<void> {
  const name = formName.value.trim();
  if (!name) {return;}

  const last_four_digits = formLastFourDigits.value.trim() || null;
  const brand: CreditCardBrand | null =
    formBrand.value === BRAND_NONE_SENTINEL ? null : formBrand.value;

  if (editingCard.value) {
    await updateMutation.mutateAsync({
      id: editingCard.value.id,
      name,
      brand,
      limit_amount: formLimitAmount.value,
      closing_day: formClosingDay.value,
      due_day: formDueDay.value,
      last_four_digits,
    });
  } else {
    await createMutation.mutateAsync({
      name,
      brand,
      limit_amount: formLimitAmount.value,
      closing_day: formClosingDay.value,
      due_day: formDueDay.value,
      last_four_digits,
    });
  }

  closeModal();
}

/**
 *
 * @param id
 */
async function confirmDelete(id: string): Promise<void> {
  await deleteMutation.mutateAsync(id);
}

const columns = computed((): DataTableColumns<CreditCardDto> => [
  {
    title: t("pages.settings.creditCards.columns.name"),
    key: "name",
  },
  {
    title: t("pages.settings.creditCards.columns.brand"),
    key: "brand",
    render(row: CreditCardDto): VNodeChild {
      if (!row.brand) {return "—";}
      const opt = BRAND_OPTIONS.value.find((o) => o.value === row.brand);
      return opt?.label ?? row.brand;
    },
  },
  {
    title: t("pages.settings.creditCards.columns.lastFour"),
    key: "last_four_digits",
    render(row: CreditCardDto): VNodeChild {
      return row.last_four_digits ? `•••• ${row.last_four_digits}` : "—";
    },
  },
  {
    title: t("pages.settings.creditCards.columns.actions"),
    key: "actions",
    width: 160,
    render(row: CreditCardDto): VNodeChild {
      return h(NSpace, { size: "small" }, () => [
        h(
          NButton,
          {
            size: "small",
            onClick: () => openEdit(row),
          },
          () => t("pages.settings.creditCards.edit"),
        ),
        h(
          NPopconfirm,
          {
            onPositiveClick: () => confirmDelete(row.id),
          },
          {
            default: () => t("pages.settings.creditCards.confirmDelete"),
            trigger: () =>
              h(
                NButton,
                { size: "small", type: "error" },
                () => t("pages.settings.creditCards.remove"),
              ),
          },
        ),
      ]);
    },
  },
]);
</script>

<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div class="settings-page__title-block">
        <span class="settings-page__title">{{ $t('pages.settings.creditCards.title') }}</span>
        <span class="settings-page__subtitle">{{ $t('pages.settings.creditCards.subtitle') }}</span>
      </div>
      <NButton type="primary" size="medium" @click="openCreate">{{ $t('pages.settings.creditCards.newCard') }}</NButton>
    </div>

    <NCard>
      <NSpin v-if="isLoading" />
      <NDataTable
        v-else
        :columns="columns"
        :data="creditCards ?? []"
        :pagination="{ pageSize: 20 }"
        :bordered="false"
        size="small"
      />
    </NCard>

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="editingCard ? $t('pages.settings.creditCards.editCard') : $t('pages.settings.creditCards.newCard')"
      :positive-text="editingCard ? $t('pages.settings.creditCards.save') : $t('pages.settings.creditCards.create')"
      :negative-text="$t('pages.settings.creditCards.cancel')"
      @positive-click="submitForm"
      @negative-click="closeModal"
    >
      <div class="modal-form">
        <NFormItem :label="$t('pages.settings.creditCards.placeholder')">
          <NInput
            v-model:value="formName"
            :placeholder="$t('pages.settings.creditCards.placeholder')"
            maxlength="100"
            show-count
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.creditCards.fields.brand')">
          <NSelect
            v-model:value="formBrand"
            :options="BRAND_OPTIONS"
            clearable
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.creditCards.fields.limitAmount')">
          <NInputNumber
            v-model:value="formLimitAmount"
            :min="0"
            :precision="2"
            clearable
            style="width: 100%;"
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.creditCards.fields.closingDay')">
          <NInputNumber
            v-model:value="formClosingDay"
            :min="1"
            :max="28"
            clearable
            style="width: 100%;"
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.creditCards.fields.dueDay')">
          <NInputNumber
            v-model:value="formDueDay"
            :min="1"
            :max="28"
            clearable
            style="width: 100%;"
          />
        </NFormItem>
        <NFormItem :label="$t('pages.settings.creditCards.fields.lastFourDigits')">
          <NInput
            v-model:value="formLastFourDigits"
            :placeholder="$t('pages.settings.creditCards.fields.lastFourDigitsPlaceholder')"
            maxlength="4"
          />
        </NFormItem>
      </div>
    </NModal>
  </div>
</template>

<style scoped>
@import "~/assets/css/settings.css";

.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-top: var(--space-2);
}
</style>
