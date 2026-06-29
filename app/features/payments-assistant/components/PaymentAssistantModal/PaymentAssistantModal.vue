<script setup lang="ts">
/**
 * Payments Assistant modal.
 *
 * Surfaces overdue open transactions one card at a time so the user can mark
 * them paid/received, discard them, or skip — with a one-tap undo. Auto-opens
 * once per session for Premium users when there is a backlog and no
 * higher-priority modal is holding the surface.
 *
 * "Marcar como pago/recebido" only updates the status inside Auraxis; it does
 * not move real money.
 */
import { computed, watch } from "vue";

import { useToast } from "~/composables/useToast";
import { usePaymentAssistant } from "~/features/payments-assistant/composables/use-payment-assistant";

const props = withDefaults(
  defineProps<{
    /** When true, a higher-priority modal (email gate, onboarding) holds the surface. */
    hold?: boolean;
  }>(),
  { hold: false },
);

const { t, n } = useI18n();
const toast = useToast();

const assistant = usePaymentAssistant();
const { isOpen, current, progress, isDone, lastAction, close } = assistant;

/** Whether the last action can still be undone (pay/delete, not skip). */
const canUndo = computed(
  () => lastAction.value?.kind === "paid" || lastAction.value?.kind === "deleted",
);

/** Action label depends on whether the current entry is income or expense. */
const payLabel = computed(() =>
  current.value?.type === "income"
    ? t("paymentsAssistant.actions.payIncome")
    : t("paymentsAssistant.actions.payExpense"),
);

/**
 * Formats a `YYYY-MM-DD` or ISO datetime as `dd/mm/yyyy` without timezone drift.
 *
 * @param value Date string to format, or null.
 * @returns Localised `dd/mm/yyyy`, or an em dash when empty.
 */
const formatDate = (value: string | null): string => {
  if (!value) {
    return "—";
  }
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Formats a decimal-string amount as BRL currency.
 *
 * @param amount Decimal string (e.g. "150.50").
 * @returns Amount formatted as BRL.
 */
const formatAmount = (amount: string): string => n(Number(amount), "currency");

watch(
  [current, (): boolean => assistant.isPremium.value, (): boolean => props.hold],
  (): void => {
    if (!isOpen.value) {
      assistant.maybeAutoOpen(props.hold);
    }
  },
  { immediate: true },
);

/** Marks the current card paid/received and toasts the result. */
const onPay = async (): Promise<void> => {
  const isIncome = current.value?.type === "income";
  await assistant.pay();
  toast.success(
    isIncome ? t("paymentsAssistant.toast.received") : t("paymentsAssistant.toast.paid"),
  );
};

/** Soft-deletes the current card and toasts the result. */
const onDelete = async (): Promise<void> => {
  await assistant.discard();
  toast.success(t("paymentsAssistant.toast.deleted"));
};

/** Skips the current card. */
const onSkip = (): void => {
  assistant.skipCard();
};

/** Marks every remaining card paid and toasts the result. */
const onMarkAll = async (): Promise<void> => {
  await assistant.markAllPaid();
  toast.success(t("paymentsAssistant.toast.allPaid"));
};

/** Reverts the last pay/delete action. */
const onUndo = async (): Promise<void> => {
  const undone = await assistant.undo();
  if (undone) {
    toast.info(t("paymentsAssistant.toast.undone"));
  }
};

/** Closes the assistant. */
const onClose = (): void => {
  close();
};
</script>

<template>
  <NModal
    :show="isOpen"
    preset="card"
    :title="t('paymentsAssistant.title')"
    :style="{ maxWidth: '480px' }"
    :bordered="false"
    :mask-closable="true"
    aria-label="Assistente de pagamentos"
    @update:show="(value: boolean) => { if (!value) { onClose(); } }"
  >
    <div v-if="!isDone && current" class="payments-assistant">
      <p class="payments-assistant__progress">
        {{ t("paymentsAssistant.progress", { current: progress.current, total: progress.total }) }}
      </p>

      <article class="payments-assistant__card" data-testid="payment-assistant-card">
        <header class="payments-assistant__card-head">
          <NTag :type="current.type === 'income' ? 'success' : 'warning'" size="small" round>
            {{
              current.type === "income"
                ? t("paymentsAssistant.type.income")
                : t("paymentsAssistant.type.expense")
            }}
          </NTag>
          <strong class="payments-assistant__amount">{{ formatAmount(current.amount) }}</strong>
        </header>

        <h3 class="payments-assistant__card-title">{{ current.title }}</h3>
        <p v-if="current.description" class="payments-assistant__card-desc">
          {{ current.description }}
        </p>

        <dl class="payments-assistant__meta">
          <div>
            <dt>{{ t("paymentsAssistant.fields.createdAt") }}</dt>
            <dd>{{ formatDate(current.created_at) }}</dd>
          </div>
          <div>
            <dt>{{ t("paymentsAssistant.fields.dueDate") }}</dt>
            <dd>{{ formatDate(current.due_date) }}</dd>
          </div>
        </dl>

        <p v-if="current.observation" class="payments-assistant__obs">
          <span class="payments-assistant__obs-label">
            {{ t("paymentsAssistant.fields.observation") }}:
          </span>
          {{ current.observation }}
        </p>
      </article>

      <p class="payments-assistant__hint">{{ t("paymentsAssistant.statusHint") }}</p>

      <div class="payments-assistant__actions">
        <NButton type="primary" block @click="onPay">{{ payLabel }}</NButton>
        <NPopconfirm @positive-click="onDelete">
          <template #trigger>
            <NButton tertiary type="error" block>
              {{ t("paymentsAssistant.actions.delete") }}
            </NButton>
          </template>
          {{ t("paymentsAssistant.confirmDelete") }}
        </NPopconfirm>
        <NButton quaternary block @click="onSkip">
          {{ t("paymentsAssistant.actions.skip") }}
        </NButton>
      </div>
    </div>

    <div v-else class="payments-assistant payments-assistant--done">
      <p class="payments-assistant__done-title">{{ t("paymentsAssistant.emptyTitle") }}</p>
      <p class="payments-assistant__done-body">{{ t("paymentsAssistant.emptyBody") }}</p>
    </div>

    <template #footer>
      <div class="payments-assistant__footer">
        <NButton v-if="canUndo" text type="primary" @click="onUndo">
          {{ t("paymentsAssistant.actions.undo") }}
        </NButton>
        <span v-else />
        <div class="payments-assistant__footer-right">
          <NButton
            v-if="!isDone && progress.total > 1"
            tertiary
            @click="onMarkAll"
          >
            {{ t("paymentsAssistant.actions.markAllPaid") }}
          </NButton>
          <NButton @click="onClose">{{ t("paymentsAssistant.actions.close") }}</NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.payments-assistant {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payments-assistant__progress {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-color-3, #8a8a8a);
}

.payments-assistant__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--card-color, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
}

.payments-assistant__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.payments-assistant__amount {
  font-size: var(--font-size-lg);
  font-variant-numeric: tabular-nums;
}

.payments-assistant__card-title {
  margin: 0;
  font-size: var(--font-size-md);
}

.payments-assistant__card-desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-color-2, #b5b5b5);
}

.payments-assistant__meta {
  display: flex;
  gap: 24px;
  margin: 4px 0 0;
}

.payments-assistant__meta dt {
  font-size: var(--font-size-xs);
  color: var(--text-color-3, #8a8a8a);
}

.payments-assistant__meta dd {
  margin: 0;
  font-size: var(--font-size-sm);
  font-variant-numeric: tabular-nums;
}

.payments-assistant__obs {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-color-2, #b5b5b5);
}

.payments-assistant__obs-label {
  font-weight: var(--font-weight-semibold);
}

.payments-assistant__hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--text-color-3, #8a8a8a);
}

.payments-assistant__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payments-assistant--done {
  align-items: center;
  text-align: center;
  padding: 16px 8px;
}

.payments-assistant__done-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.payments-assistant__done-body {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-color-2, #b5b5b5);
}

.payments-assistant__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.payments-assistant__footer-right {
  display: flex;
  gap: 8px;
}
</style>
