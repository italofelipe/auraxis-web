<script setup lang="ts">
import { NButton, NCard, NInput, NModal, NTag, NText } from "naive-ui";

import type { ImportReviewCard } from "~/features/import/composables/useImportReview";
import type { ImportMissingField } from "~/features/import/model/import";

const props = defineProps<{
  show: boolean;
  cards: readonly ImportReviewCard[];
  totalCount: number;
  resolvedCount: number;
  pendingCount: number;
  isComplete: boolean;
  busy: boolean;
}>();

const emit = defineEmits<{
  answer: [draftId: string, field: ImportMissingField, value: string];
  submit: [];
  "finish-later": [];
  cancel: [];
}>();

const { t } = useI18n();

/**
 * Rótulo de receita/despesa — a especificação exige que o usuário veja de que
 * lado está a transação antes de completar o dado que falta.
 *
 * @param card Card em conferência.
 * @returns Texto traduzido do tipo.
 */
const typeLabel = (card: ImportReviewCard): string =>
  card.draft.type === "income" ? t("import.review.income") : t("import.review.expense");
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    :title="t('import.review.modalTitle')"
    style="width: min(680px, 95vw)"
    :mask-closable="false"
    :aria-label="t('import.review.modalTitle')"
    data-testid="import-review-modal"
    @update:show="(value: boolean) => !value && emit('cancel')"
  >
    <div class="import-review">
      <NText depth="3">{{ t("import.review.modalDescription") }}</NText>

      <!-- Total e restantes sempre visíveis, e anunciados a cada resposta. -->
      <div class="import-review__counters" aria-live="polite">
        <NText strong data-testid="import-review-progress">
          {{ t("import.review.progress", { resolved: props.resolvedCount, total: props.totalCount }) }}
        </NText>
        <NTag :type="props.pendingCount > 0 ? 'warning' : 'success'" :bordered="false">
          {{ t("import.review.pending", props.pendingCount) }}
        </NTag>
      </div>

      <NCard
        v-for="(card, index) in props.cards"
        :key="card.draft.id"
        size="small"
        :data-testid="`import-review-card-${card.draft.id}`"
      >
        <div class="import-review__card">
          <div class="import-review__card-header">
            <NTag
              size="small"
              :bordered="false"
              :type="card.draft.type === 'income' ? 'success' : 'error'"
            >
              {{ typeLabel(card) }}
            </NTag>
            <NText depth="3">
              {{ t("import.review.cardCounter", { current: index + 1, total: props.totalCount }) }}
            </NText>
            <NTag size="small" :bordered="false" :type="card.isResolved ? 'success' : 'warning'">
              {{ card.isResolved ? t("import.review.resolved") : t("import.review.missing") }}
            </NTag>
          </div>

          <NText depth="3">{{ card.draft.date }}</NText>

          <label
            v-if="card.draft.missingFields.includes('description')"
            class="import-review__field"
          >
            <NText strong>{{ t("import.review.askDescription") }}</NText>
            <NInput
              :value="card.answers.description ?? ''"
              :placeholder="t('import.review.descriptionPlaceholder')"
              :aria-label="t('import.review.askDescription')"
              :data-testid="`import-review-description-${card.draft.id}`"
              @update:value="(value: string) => emit('answer', card.draft.id, 'description', value)"
            />
          </label>

          <label
            v-if="card.draft.missingFields.includes('amount')"
            class="import-review__field"
          >
            <NText strong>{{ t("import.review.askAmount") }}</NText>
            <NInput
              :value="card.answers.amount ?? ''"
              :placeholder="t('import.review.amountPlaceholder')"
              :aria-label="t('import.review.askAmount')"
              :data-testid="`import-review-amount-${card.draft.id}`"
              @update:value="(value: string) => emit('answer', card.draft.id, 'amount', value)"
            />
          </label>
        </div>
      </NCard>
    </div>

    <template #footer>
      <div class="import-review__footer">
        <!-- `disabled` sozinho não conta o motivo a ninguém. -->
        <NText v-if="!props.isComplete" depth="3" data-testid="import-review-blocked-hint">
          {{ t("import.review.blockedHint") }}
        </NText>
        <div class="import-review__actions">
          <NButton quaternary data-testid="import-review-finish-later" @click="emit('finish-later')">
            {{ t("import.review.finishLater") }}
          </NButton>
          <NButton
            type="primary"
            :disabled="!props.isComplete || props.busy"
            :loading="props.busy"
            data-testid="import-review-submit"
            @click="emit('submit')"
          >
            {{ t("import.review.finishNow") }}
          </NButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.import-review {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: 60vh;
  overflow-y: auto;
}

.import-review__counters {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.import-review__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.import-review__card-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.import-review__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.import-review__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.import-review__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
