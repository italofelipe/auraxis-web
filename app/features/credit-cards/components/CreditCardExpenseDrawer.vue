<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  CalendarDays,
  CreditCard,
  ReceiptText,
  Tags,
} from "lucide-vue-next";
import {
  NAlert,
  NButton,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSelect,
  NSwitch,
  NTag,
  type FormInst,
  type FormRules,
  type SelectOption,
} from "naive-ui";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import {
  resolveCreditCardBillingCycle,
  type BillingCyclePreview,
} from "~/features/credit-cards/utils/billing-cycle";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import type {
  CreateTransactionPayload,
  TransactionImpactPolicyDto,
  TransactionStatusDto,
} from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";
import { serializeCurrencyAmount } from "~/utils/currencyInput";

const props = defineProps<{
  visible: boolean;
  presetCreditCardId?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

interface DrawerFormState {
  title: string;
  amount: number | null;
  purchaseDate: number | null;
  creditCardId: string | null;
  tagId: string | null;
  accountId: string | null;
  status: TransactionStatusDto;
  impactPolicy: TransactionImpactPolicyDto;
  isInstallment: boolean;
  installmentCount: number | null;
  description: string;
}

/**
 * Returns today's local midnight timestamp for Naive UI date picker state.
 *
 * @returns Local midnight timestamp.
 */
const nowDateTs = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

/**
 * Creates the drawer form state, preserving an optional preset card.
 *
 * @returns Fresh drawer state.
 */
const createDefaultState = (): DrawerFormState => ({
  title: "",
  amount: null,
  purchaseDate: nowDateTs(),
  creditCardId: props.presetCreditCardId ?? null,
  tagId: null,
  accountId: null,
  status: "pending",
  impactPolicy: "full",
  isInstallment: false,
  installmentCount: 2,
  description: "",
});

const formRef = ref<FormInst | null>(null);
const form = reactive<DrawerFormState>(createDefaultState());

const { data: cards } = useCreditCardsQuery();
const { data: tags } = useTagsQuery();
const { data: accounts } = useAccountsQuery();
const mutation = useCreateTransactionMutation();

const cardOptions = computed<SelectOption[]>(() =>
  (cards.value ?? []).map((card) => ({
    label: card.bank ? `${card.name} · ${card.bank}` : card.name,
    value: card.id,
  })),
);

const tagOptions = computed<SelectOption[]>(() =>
  (tags.value ?? []).map((tag) => ({ label: tag.name, value: tag.id })),
);

const accountOptions = computed<SelectOption[]>(() =>
  (accounts.value ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  })),
);

const selectedCard = computed<CreditCardDto | null>(
  () => (cards.value ?? []).find((card) => card.id === form.creditCardId) ?? null,
);

const selectedLimitLabel = computed<string>(() =>
  selectedCard.value?.limit_amount !== null && selectedCard.value?.limit_amount !== undefined
    ? formatCurrency(selectedCard.value.limit_amount)
    : "Limite não definido",
);

const billingCycle = computed<BillingCyclePreview | null>(() => {
  const card = selectedCard.value;
  if (
    !card ||
    form.purchaseDate === null ||
    card.closing_day === null ||
    card.due_day === null
  ) {
    return null;
  }
  return resolveCreditCardBillingCycle({
    purchaseDate: new Date(form.purchaseDate),
    closingDay: card.closing_day,
    dueDay: card.due_day,
  });
});

const statusOptions: SelectOption[] = [
  { label: "Pendente", value: "pending" },
  { label: "Pago", value: "paid" },
  { label: "Postergado", value: "postponed" },
];

const impactOptions: Array<{
  label: string;
  value: TransactionImpactPolicyDto;
  description: string;
}> = [
  {
    label: "Completo",
    value: "full",
    description: "Atualiza cartões, transações, dashboard e orçamentos.",
  },
  {
    label: "Só cartões",
    value: "cards_only",
    description: "Entra na fatura e no limite, mas não afeta orçamento geral.",
  },
  {
    label: "Planejado até a fatura",
    value: "planned_until_bill",
    description: "Mantém a compra visível como compromisso até o fechamento.",
  },
];

const rules: FormRules = {
  title: [{ required: true, message: "Informe o título", trigger: "blur" }],
  amount: [
    {
      required: true,
      type: "number",
      message: "Informe o valor",
      trigger: ["blur", "change"],
    },
  ],
  purchaseDate: [
    {
      required: true,
      type: "number",
      message: "Informe a data da compra",
      trigger: "change",
    },
  ],
  creditCardId: [
    {
      required: true,
      message: "Selecione o cartão",
      trigger: ["blur", "change"],
    },
  ],
  installmentCount: [
    {
      validator: (): boolean => !form.isInstallment || Number(form.installmentCount) >= 2,
      message: "Informe pelo menos 2 parcelas",
      trigger: ["blur", "change"],
    },
  ],
};

/**
 * Serializes a local timestamp to the API date-only format.
 *
 * @param ts Local timestamp from the date picker.
 * @returns Date-only string for the API.
 */
const tsToDate = (ts: number): string => {
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/** Restores all drawer fields to their default values. */
const resetForm = (): void => {
  Object.assign(form, createDefaultState());
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      form.creditCardId = props.presetCreditCardId ?? form.creditCardId;
    }
  },
);

watch(
  () => props.presetCreditCardId,
  (cardId) => {
    if (cardId && props.visible) {
      form.creditCardId = cardId;
    }
  },
);

/** Closes the drawer and clears transient form state. */
const close = (): void => {
  emit("update:visible", false);
  resetForm();
};

/**
 * Builds the transaction payload accepted by the API card-launch flow.
 *
 * @returns Create transaction payload.
 */
const buildPayload = (): CreateTransactionPayload => ({
  title: form.title.trim(),
  amount: serializeCurrencyAmount(form.amount),
  type: "expense",
  due_date: form.purchaseDate ? tsToDate(form.purchaseDate) : "",
  status: form.status,
  credit_card_id: form.creditCardId,
  tag_id: form.tagId,
  account_id: form.accountId,
  impact_policy: form.impactPolicy,
  ...(form.description.trim() ? { description: form.description.trim() } : {}),
  ...(form.isInstallment
    ? {
        is_installment: true,
        installment_count: form.installmentCount ?? 2,
      }
    : {}),
});

/** Validates and submits the card expense drawer form. */
const submit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  await mutation.mutateAsync(buildPayload());
  emit("success");
  close();
};
</script>

<template>
  <NDrawer
    :show="props.visible"
    placement="right"
    :width="860"
    @update:show="(value: boolean) => (value ? emit('update:visible', true) : close())"
  >
    <NDrawerContent
      title="Lançar despesa no cartão"
      closable
      native-scrollbar
      class="cc-expense-drawer"
    >
      <div class="cc-expense-drawer__intro">
        <div>
          <p class="cc-expense-drawer__eyebrow">Operação de cartão</p>
          <h2>Compra, fatura e impacto em um só lugar</h2>
        </div>
        <NTag type="info" :bordered="false">Data da compra ≠ vencimento</NTag>
      </div>

      <NAlert
        v-if="mutation.isError.value"
        type="error"
        title="Não foi possível lançar a despesa"
        class="cc-expense-drawer__alert"
      >
        {{ mutation.error.value?.message ?? "Revise os campos e tente novamente." }}
      </NAlert>

      <div class="cc-expense-drawer__layout">
        <NForm
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="top"
          class="cc-expense-drawer__form"
        >
          <section class="cc-expense-drawer__section">
            <header>
              <ReceiptText :size="18" />
              <span>Compra</span>
            </header>
            <div class="cc-expense-drawer__grid cc-expense-drawer__grid--two">
              <NFormItem label="Título" path="title">
                <NInput v-model:value="form.title" placeholder="Ex: Mercado do mês" />
              </NFormItem>
              <NFormItem label="Valor" path="amount">
                <UiMoneyInput v-model:value="form.amount" placeholder="0,00" :min="0.01" />
              </NFormItem>
              <NFormItem label="Data da compra" path="purchaseDate">
                <NDatePicker
                  v-model:value="form.purchaseDate"
                  type="date"
                  format="dd/MM/yyyy"
                  clearable
                  style="width: 100%"
                />
              </NFormItem>
              <NFormItem label="Cartão" path="creditCardId">
                <NSelect
                  v-model:value="form.creditCardId"
                  :options="cardOptions"
                  placeholder="Selecione um cartão"
                  filterable
                  clearable
                />
              </NFormItem>
            </div>
          </section>

          <section class="cc-expense-drawer__section">
            <header>
              <Tags :size="18" />
              <span>Classificação</span>
            </header>
            <div class="cc-expense-drawer__grid cc-expense-drawer__grid--three">
              <NFormItem label="Categoria" path="tagId">
                <NSelect
                  v-model:value="form.tagId"
                  :options="tagOptions"
                  placeholder="Opcional"
                  filterable
                  clearable
                />
              </NFormItem>
              <NFormItem label="Conta" path="accountId">
                <NSelect
                  v-model:value="form.accountId"
                  :options="accountOptions"
                  placeholder="Opcional"
                  filterable
                  clearable
                />
              </NFormItem>
              <NFormItem label="Status" path="status">
                <NSelect v-model:value="form.status" :options="statusOptions" />
              </NFormItem>
            </div>
          </section>

          <section class="cc-expense-drawer__section">
            <header>
              <CreditCard :size="18" />
              <span>Integração</span>
            </header>
            <NFormItem label="Política de impacto" path="impactPolicy">
              <NRadioGroup v-model:value="form.impactPolicy" class="cc-impact-options">
                <label
                  v-for="option in impactOptions"
                  :key="option.value"
                  class="cc-impact-option"
                >
                  <NRadio :value="option.value" />
                  <span>
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.description }}</small>
                  </span>
                </label>
              </NRadioGroup>
            </NFormItem>
          </section>

          <section class="cc-expense-drawer__section">
            <header>
              <CalendarDays :size="18" />
              <span>Parcelamento e notas</span>
            </header>
            <div class="cc-expense-drawer__installment-row">
              <NFormItem label="Parcelado?" path="isInstallment">
                <NSwitch v-model:value="form.isInstallment" />
              </NFormItem>
              <NFormItem
                v-if="form.isInstallment"
                label="Parcelas"
                path="installmentCount"
              >
                <NInputNumber
                  v-model:value="form.installmentCount"
                  :min="2"
                  :max="60"
                  style="width: 100%"
                />
              </NFormItem>
            </div>
            <NFormItem label="Descrição" path="description">
              <NInput
                v-model:value="form.description"
                type="textarea"
                :rows="3"
                placeholder="Detalhes úteis para lembrar depois"
              />
            </NFormItem>
          </section>
        </NForm>

        <aside class="cc-expense-drawer__preview">
          <p class="cc-expense-drawer__preview-label">Prévia da fatura</p>
          <template v-if="billingCycle">
            <strong>Cai na fatura de {{ billingCycle.billLabel }}</strong>
            <dl>
              <div>
                <dt>Fecha dia</dt>
                <dd>{{ billingCycle.closingDate }}</dd>
              </div>
              <div>
                <dt>Vence dia</dt>
                <dd>{{ billingCycle.dueDate }}</dd>
              </div>
              <div>
                <dt>Ciclo</dt>
                <dd>{{ billingCycle.cycleStartDate }} → {{ billingCycle.closingDate }}</dd>
              </div>
              <div>
                <dt>Limite</dt>
                <dd>{{ selectedLimitLabel }}</dd>
              </div>
            </dl>
          </template>
          <template v-else>
            <strong>Selecione um cartão com ciclo configurado.</strong>
            <p>Fechamento e vencimento aparecem assim que houver cartão e data.</p>
          </template>
        </aside>
      </div>

      <template #footer>
        <div class="cc-expense-drawer__footer">
          <NButton :disabled="mutation.isPending.value" @click="close">Cancelar</NButton>
          <NButton type="primary" :loading="mutation.isPending.value" @click="submit">
            Lançar despesa
          </NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.cc-expense-drawer :deep(.n-drawer-body-content-wrapper) {
  padding: 0;
}

.cc-expense-drawer__intro {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
}

.cc-expense-drawer__intro h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.cc-expense-drawer__eyebrow,
.cc-expense-drawer__preview-label {
  margin: 0 0 var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.cc-expense-drawer__alert {
  margin-top: var(--space-3);
}

.cc-expense-drawer__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.cc-expense-drawer__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.cc-expense-drawer__section {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
}

.cc-expense-drawer__section header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.cc-expense-drawer__grid {
  display: grid;
  gap: var(--space-2);
}

.cc-expense-drawer__grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cc-expense-drawer__grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cc-impact-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  width: 100%;
}

.cc-impact-option {
  display: flex;
  gap: var(--space-1);
  min-height: 112px;
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}

.cc-impact-option span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cc-impact-option small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.cc-expense-drawer__installment-row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: var(--space-2);
}

.cc-expense-drawer__preview {
  align-self: start;
  position: sticky;
  top: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.cc-expense-drawer__preview strong {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-md);
}

.cc-expense-drawer__preview dl {
  display: grid;
  gap: var(--space-2);
  margin: 0;
}

.cc-expense-drawer__preview dl div {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-outline-soft);
}

.cc-expense-drawer__preview dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.cc-expense-drawer__preview dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-medium);
  text-align: right;
}

.cc-expense-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 900px) {
  .cc-expense-drawer__layout,
  .cc-expense-drawer__grid--two,
  .cc-expense-drawer__grid--three,
  .cc-impact-options,
  .cc-expense-drawer__installment-row {
    grid-template-columns: 1fr;
  }

  .cc-expense-drawer__preview {
    position: static;
  }
}
</style>
