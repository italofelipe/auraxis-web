<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { NAlert, NButton, NCheckbox, NDatePicker, NSelect, type SelectOption } from "naive-ui";

import UiBottomSheet from "~/components/ui/UiBottomSheet/UiBottomSheet.vue";
import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiMoneyInput from "~/components/ui/UiMoneyInput/UiMoneyInput.vue";
import UiSegmentedControl from "~/components/ui/UiSegmentedControl/UiSegmentedControl.vue";
import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreditCardUtilizationQuery } from "~/features/credit-cards/queries/use-credit-card-utilization-query";
import {
  type BillingCyclePreview,
  resolveCreditCardBillingCycle,
} from "~/features/credit-cards/utils/billing-cycle";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import type {
  TransactionImpactPolicyDto,
  TransactionStatusDto,
} from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";

import { type InstallmentMode, buildDistribution } from "../model/installment-plan";
import { buildExpensePayloads } from "../model/expense-submission";
import { formatDayMonth } from "../utils/format";

const props = defineProps<{
  visible: boolean;
  presetCreditCardId?: string | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

interface SheetForm {
  title: string;
  amount: number | null;
  purchaseDate: number | null;
  creditCardId: string | null;
  tagId: string | null;
  accountId: string | null;
  status: TransactionStatusDto;
  impactPolicy: TransactionImpactPolicyDto;
  mode: InstallmentMode;
  installments: number;
  hasDownPayment: boolean;
  downPayment: number | null;
  description: string;
}

/**
 * Local midnight timestamp for the date picker default.
 *
 * @returns Timestamp.
 */
const nowTs = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

/**
 * Fresh form state, honouring an optional preset card.
 *
 * @returns Default form.
 */
const createDefaultState = (): SheetForm => ({
  title: "",
  amount: null,
  purchaseDate: nowTs(),
  creditCardId: props.presetCreditCardId ?? null,
  tagId: null,
  accountId: null,
  status: "pending",
  impactPolicy: "full",
  mode: "avista",
  installments: 3,
  hasDownPayment: false,
  downPayment: null,
  description: "",
});

const form = reactive<SheetForm>(createDefaultState());
const submitting = ref(false);
const submitError = ref<string | null>(null);

const { data: cards } = useCreditCardsQuery();
const { data: tags } = useTagsQuery();
const { data: accounts } = useAccountsQuery();
const utilizationCardId = computed<string>(() => form.creditCardId ?? "");
const { data: utilization } = useCreditCardUtilizationQuery(utilizationCardId);
const mutation = useCreateTransactionMutation();

const modeOptions: { value: InstallmentMode; label: string }[] = [
  { value: "avista", label: "À vista" },
  { value: "parcelado", label: "Parcelado" },
];

const statusOptions: SelectOption[] = [
  { label: "Pendente", value: "pending" },
  { label: "Pago", value: "paid" },
  { label: "Postergado", value: "postponed" },
];

const impactOptions: { label: string; value: TransactionImpactPolicyDto; description: string }[] = [
  { label: "Completo", value: "full", description: "Atualiza cartões, transações, dashboard e orçamentos." },
  { label: "Só cartões", value: "cards_only", description: "Entra na fatura e no limite, sem afetar o orçamento geral." },
  { label: "Planejado até a fatura", value: "planned_until_bill", description: "Visível como compromisso até o fechamento." },
];

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
  (accounts.value ?? []).map((account) => ({ label: account.name, value: account.id })),
);

const selectedCard = computed<CreditCardDto | null>(
  () => (cards.value ?? []).find((card) => card.id === form.creditCardId) ?? null,
);

/**
 * Serializes a picker timestamp to YYYY-MM-DD.
 *
 * @param ts Timestamp.
 * @returns Date-only string.
 */
const tsToDate = (ts: number): string => {
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const purchaseDateStr = computed<string>(() => (form.purchaseDate ? tsToDate(form.purchaseDate) : ""));

const billingCycle = computed<BillingCyclePreview | null>(() => {
  const card = selectedCard.value;
  if (!card || form.purchaseDate === null || card.closing_day === null || card.due_day === null) {
    return null;
  }
  return resolveCreditCardBillingCycle({
    purchaseDate: new Date(form.purchaseDate),
    closingDay: card.closing_day,
    dueDay: card.due_day,
  });
});

const startBillMonth = computed<string>(() => {
  if (billingCycle.value) {
    return billingCycle.value.billMonth;
  }
  const ts = form.purchaseDate ?? nowTs();
  const date = new Date(ts);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
});

const totalAmount = computed<number>(() => form.amount ?? 0);
const distribution = computed(() =>
  buildDistribution({
    mode: form.mode,
    total: totalAmount.value,
    downPayment: form.downPayment ?? 0,
    hasDownPayment: form.hasDownPayment,
    installments: form.installments,
    startBillMonth: startBillMonth.value,
  }),
);
const visibleChips = computed(() => distribution.value.slice(0, 8));
const overflowChips = computed<number>(() => Math.max(0, distribution.value.length - 8));

const limitLabel = computed<string>(() => {
  const limit = selectedCard.value?.limit_amount;
  return typeof limit === "number" ? formatCurrency(limit) : "—";
});
const availableLabel = computed<string>(() => {
  const available = utilization.value?.availableAmount;
  return typeof available === "number" ? formatCurrency(available) : "—";
});
const cycleLabel = computed<string>(() => {
  const card = selectedCard.value;
  if (card && typeof card.closing_day === "number" && typeof card.due_day === "number") {
    return `Fecha ${card.closing_day} · vence ${card.due_day}`;
  }
  return "—";
});

const canSubmit = computed<boolean>(() => totalAmount.value > 0);
const footerHint = computed<string>(() =>
  selectedCard.value ? `Lançar em ${selectedCard.value.name}` : "O cartão pode ser escolhido depois",
);

watch(
  () => props.presetCreditCardId,
  (cardId) => {
    if (cardId && props.visible) {
      form.creditCardId = cardId;
    }
  },
);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      Object.assign(form, createDefaultState());
      submitError.value = null;
    }
  },
);

/** Fecha o sheet. */
const close = (): void => {
  emit("update:visible", false);
};

/**
 * Ajusta o número de parcelas dentro de [2, 24].
 *
 * @param delta Incremento.
 */
const stepInstallments = (delta: number): void => {
  form.installments = Math.max(2, Math.min(24, form.installments + delta));
};

/** Valida, cria a(s) transação(ões) e fecha em caso de sucesso. */
const submit = async (): Promise<void> => {
  if (!canSubmit.value || submitting.value) {
    return;
  }
  submitError.value = null;
  submitting.value = true;
  const payloads = buildExpensePayloads({
    title: form.title.trim() || "Despesa no cartão",
    amount: totalAmount.value,
    purchaseDate: purchaseDateStr.value,
    creditCardId: form.creditCardId,
    tagId: form.tagId,
    accountId: form.accountId,
    status: form.status,
    impactPolicy: form.impactPolicy,
    mode: form.mode,
    installments: form.installments,
    hasDownPayment: form.hasDownPayment,
    downPayment: form.downPayment ?? 0,
    description: form.description,
  });

  let created = 0;
  for (const payload of payloads) {
    try {
      await mutation.mutateAsync(payload);
      created += 1;
    } catch {
      submitError.value =
        created > 0
          ? "A entrada foi lançada, mas o parcelamento falhou. Tente lançar o restante novamente."
          : "Não foi possível lançar a despesa. Revise os campos e tente novamente.";
      submitting.value = false;
      return;
    }
  }

  submitting.value = false;
  emit("success");
  close();
};
</script>

<template>
  <UiBottomSheet
    :model-value="props.visible"
    aria-label="Lançar despesa no cartão"
    @update:model-value="(value) => (value ? emit('update:visible', true) : close())"
  >
    <template #header>
      <p class="ces__eyebrow">Operação de cartão</p>
      <div class="ces__head-row">
        <h2 class="ces__title">Lançar despesa no cartão</h2>
        <span class="ces__pill">Data da compra ≠ vencimento</span>
      </div>
    </template>

    <NAlert v-if="submitError" type="error" class="ces__alert" :title="submitError" />

    <div class="ces__grid">
      <!-- Coluna esquerda: a compra -->
      <div class="ces__col">
        <div class="ces__amount">
          <label class="ces__label">Valor da compra</label>
          <UiMoneyInput v-model:value="form.amount" placeholder="0,00" :min="0" data-testid="ces-amount" />
        </div>

        <div class="ces__row">
          <label class="ces__field">
            <span class="ces__label">Título</span>
            <input v-model="form.title" class="ces__input" placeholder="Ex: Mercado do mês" >
          </label>
          <label class="ces__field ces__field--date">
            <span class="ces__label">Data da compra</span>
            <NDatePicker v-model:value="form.purchaseDate" type="date" format="dd/MM/yyyy" style="width: 100%" />
          </label>
        </div>

        <div class="ces__field">
          <span class="ces__label">
            Cartão <span class="ces__opt">opcional agora</span>
          </span>
          <NSelect
            v-model:value="form.creditCardId"
            :options="cardOptions"
            placeholder="Escolher agora ou depois"
            filterable
            clearable
          />
          <div v-if="selectedCard" class="ces__minicards">
            <div class="ces__minicard">
              <span class="ces__mini-label">Limite</span>
              <span class="ces__mini-value">{{ limitLabel }}</span>
            </div>
            <div class="ces__minicard">
              <span class="ces__mini-label">Disponível</span>
              <span class="ces__mini-value">{{ availableLabel }}</span>
            </div>
            <div class="ces__minicard">
              <span class="ces__mini-label">Ciclo</span>
              <span class="ces__mini-value">{{ cycleLabel }}</span>
            </div>
          </div>
        </div>

        <div class="ces__row ces__row--three">
          <label class="ces__field">
            <span class="ces__label">Categoria</span>
            <NSelect v-model:value="form.tagId" :options="tagOptions" placeholder="Opcional" filterable clearable />
          </label>
          <label class="ces__field">
            <span class="ces__label">Conta</span>
            <NSelect v-model:value="form.accountId" :options="accountOptions" placeholder="Opcional" filterable clearable />
          </label>
          <label class="ces__field">
            <span class="ces__label">Status</span>
            <NSelect v-model:value="form.status" :options="statusOptions" />
          </label>
        </div>
      </div>

      <!-- Coluna direita: termos -->
      <div class="ces__col">
        <div class="ces__field">
          <span class="ces__label">Parcelamento</span>
          <UiSegmentedControl v-model="form.mode" :options="modeOptions" aria-label="Modo de pagamento" />
        </div>

        <div v-if="form.mode === 'parcelado'" class="ces__installments">
          <div class="ces__stepper">
            <span class="ces__label">Parcelas</span>
            <div class="ces__stepper-controls">
              <button type="button" class="ces__step" aria-label="Menos parcelas" @click="stepInstallments(-1)">
                <UiIcon name="minus" :size="16" />
              </button>
              <span class="ces__step-value">{{ form.installments }}x</span>
              <button type="button" class="ces__step" aria-label="Mais parcelas" @click="stepInstallments(1)">
                <UiIcon name="plus" :size="16" />
              </button>
            </div>
          </div>

          <NCheckbox v-model:checked="form.hasDownPayment">Dar uma entrada</NCheckbox>
          <div v-if="form.hasDownPayment" class="ces__field ces__field--entry">
            <span class="ces__label">Valor da entrada</span>
            <UiMoneyInput v-model:value="form.downPayment" placeholder="0,00" :min="0" />
          </div>

          <div class="ces__distribution">
            <span class="ces__label">Distribuição nas faturas</span>
            <div class="ces__chips">
              <span
                v-for="chip in visibleChips"
                :key="chip.key"
                class="ces__chip"
                :class="{ 'ces__chip--entry': chip.isEntry }"
              >
                <span class="ces__chip-label">{{ chip.label }}</span>
                <span class="ces__chip-sub">{{ chip.sub }}</span>
                <span class="ces__chip-value">{{ formatCurrency(chip.value) }}</span>
              </span>
              <span v-if="overflowChips > 0" class="ces__chip ces__chip--more">+{{ overflowChips }}</span>
            </div>
          </div>
        </div>

        <div class="ces__preview">
          <span class="ces__label">Prévia da fatura</span>
          <strong v-if="billingCycle" class="ces__preview-title">Cai na fatura de {{ billingCycle.billLabel }}</strong>
          <strong v-else class="ces__preview-title">Defina o cartão para ver a fatura</strong>
          <dl class="ces__preview-rows">
            <div v-if="billingCycle">
              <dt>Fecha dia</dt>
              <dd>{{ formatDayMonth(billingCycle.closingDate) }}</dd>
            </div>
            <div v-if="billingCycle">
              <dt>Vence dia</dt>
              <dd>{{ formatDayMonth(billingCycle.dueDate) }}</dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd>{{ formatCurrency(totalAmount) }}</dd>
            </div>
            <div v-if="selectedCard">
              <dt>Limite</dt>
              <dd>{{ limitLabel }}</dd>
            </div>
          </dl>
        </div>

        <div class="ces__field">
          <span class="ces__label">Política de impacto</span>
          <div class="ces__impact">
            <button
              v-for="option in impactOptions"
              :key="option.value"
              type="button"
              class="ces__impact-option"
              :class="{ 'ces__impact-option--active': form.impactPolicy === option.value }"
              @click="form.impactPolicy = option.value"
            >
              <span class="ces__impact-title">{{ option.label }}</span>
              <span class="ces__impact-desc">{{ option.description }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="ces__footer">
        <span class="ces__hint">{{ footerHint }}</span>
        <div class="ces__footer-actions">
          <NButton :disabled="submitting" @click="close">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            data-testid="ces-submit"
            @click="submit"
          >
            Lançar despesa
          </NButton>
        </div>
      </div>
    </template>
  </UiBottomSheet>
</template>

<style scoped>
.ces__eyebrow {
  margin: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
.ces__head-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.ces__title {
  margin: 2px 0 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.ces__pill {
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: var(--color-brand-hover-surface, var(--color-bg-elevated));
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}
.ces__alert {
  margin-bottom: var(--space-3);
}
.ces__grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: var(--space-4);
  align-items: start;
}
.ces__col {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.ces__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ces__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.ces__opt {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}
.ces__amount {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-brand-200, var(--color-outline-soft));
  background: linear-gradient(135deg, var(--color-brand-hover-surface, var(--color-bg-elevated)), var(--color-bg-surface));
}
.ces__row {
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: var(--space-2);
}
.ces__row--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.ces__input {
  width: 100%;
  height: 34px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-family: var(--font-body);
}
.ces__input:focus {
  outline: none;
  border-color: var(--color-brand-500);
}
.ces__minicards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
  margin-top: 6px;
}
.ces__minicard {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
}
.ces__mini-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.ces__mini-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.ces__installments {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
}
.ces__stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.ces__stepper-controls {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.ces__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.ces__step-value {
  min-width: 40px;
  text-align: center;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-bold);
  color: var(--color-brand-500);
}
.ces__field--entry {
  max-width: 220px;
}
.ces__distribution {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ces__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.ces__chip {
  display: flex;
  flex-direction: column;
  min-width: 78px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
}
.ces__chip--entry {
  border-color: var(--color-brand-500);
  background: var(--color-brand-hover-surface, var(--color-bg-elevated));
}
.ces__chip--more {
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}
.ces__chip-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.ces__chip-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.ces__chip-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.ces__preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.ces__preview-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.ces__preview-rows {
  display: flex;
  flex-direction: column;
  margin: 0;
}
.ces__preview-rows div {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--color-outline-soft);
}
.ces__preview-rows dt {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.ces__preview-rows dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.ces__impact {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.ces__impact-option {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border: 1.5px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  text-align: left;
  cursor: pointer;
}
.ces__impact-option--active {
  border-color: var(--color-brand-500);
  background: var(--color-brand-hover-surface, var(--color-bg-elevated));
}
.ces__impact-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.ces__impact-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.4;
}
.ces__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.ces__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.ces__footer-actions {
  display: flex;
  gap: var(--space-2);
}
@media (max-width: 880px) {
  .ces__grid {
    grid-template-columns: 1fr;
  }
  .ces__row,
  .ces__row--three,
  .ces__minicards {
    grid-template-columns: 1fr;
  }
}
</style>
