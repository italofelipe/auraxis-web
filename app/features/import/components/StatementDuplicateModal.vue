<script setup lang="ts">
/**
 * Comparação lado a lado entre o lançamento do extrato e a transação que o
 * usuário já tinha.
 *
 * Um número de confiança sozinho não é acionável. O que a pessoa precisa ver é
 * o que coincide, o que diverge, quantos dias separam as duas datas e a frase
 * que justifica a classificação — e então decidir.
 */
import { NAlert, NButton, NModal, NTag } from "naive-ui";
import { computed } from "vue";

import type {
  StatementDecisionAction,
  StatementEntry,
} from "~/features/import/model/statement-import";

const properties = defineProps<{
  show: boolean;
  entry: StatementEntry | null;
}>();

const emit = defineEmits<{
  (event: "cancel"): void;
  (event: "decide", action: StatementDecisionAction): void;
}>();

const evidence = computed(() => properties.entry?.matchEvidence ?? null);

const dayLabel = computed(() => {
  const difference = evidence.value?.dayDifference;
  if (difference === null || difference === undefined) {
    return null;
  }
  return difference;
});

/**
 * Emite a decisão escolhida.
 *
 * @param action Ação escolhida pelo usuário.
 * @returns Nada; a decisão sobe para o wizard.
 */
const decide = (action: StatementDecisionAction): void => emit("decide", action);
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :mask-closable="false"
    :title="$t('import.statement.duplicate.title')"
    :aria-label="$t('import.statement.duplicate.title')"
    style="width: min(680px, 95vw)"
    data-testid="statement-duplicate-modal"
    @update:show="(value: boolean) => !value && emit('cancel')"
  >
    <template v-if="entry">
      <NAlert
        type="warning"
        :bordered="false"
        class="duplicate__reason"
        data-testid="statement-duplicate-reason"
      >
        {{ entry.matchEvidence.reason }}
      </NAlert>

      <dl class="duplicate__grid">
        <div class="duplicate__row">
          <dt>{{ $t("import.statement.duplicate.statementLine") }}</dt>
          <dd data-testid="statement-duplicate-line">
            {{ entry.postingDate }} · {{ entry.rawDescription }} ·
            {{ entry.amount }}
          </dd>
        </div>
        <div class="duplicate__row">
          <dt>{{ $t("import.statement.duplicate.confidence") }}</dt>
          <dd data-testid="statement-duplicate-confidence">
            {{ entry.matchScore }} ({{ $t(`import.statement.match.${entry.matchStatus}`) }})
          </dd>
        </div>
        <div v-if="dayLabel !== null" class="duplicate__row">
          <dt>{{ $t("import.statement.duplicate.dayDifference") }}</dt>
          <dd data-testid="statement-duplicate-days">
            {{ $t("import.statement.duplicate.days", { count: dayLabel }) }}
          </dd>
        </div>
      </dl>

      <div class="duplicate__fields">
        <div v-if="entry.matchEvidence.agreed.length" data-testid="statement-duplicate-agreed">
          <span class="duplicate__label">{{ $t("import.statement.duplicate.agreed") }}</span>
          <NTag
            v-for="field in entry.matchEvidence.agreed"
            :key="field"
            type="success"
            size="small"
            :bordered="false"
          >
            {{ $t(`import.statement.field.${field}`) }}
          </NTag>
        </div>
        <div v-if="entry.matchEvidence.diverged.length" data-testid="statement-duplicate-diverged">
          <span class="duplicate__label">{{ $t("import.statement.duplicate.diverged") }}</span>
          <NTag
            v-for="field in entry.matchEvidence.diverged"
            :key="field"
            type="warning"
            size="small"
            :bordered="false"
          >
            {{ $t(`import.statement.field.${field}`) }}
          </NTag>
        </div>
      </div>

      <NAlert type="info" :bordered="false" class="duplicate__safety">
        {{ $t("import.statement.duplicate.safety") }}
      </NAlert>
    </template>

    <template #footer>
      <div class="duplicate__actions">
        <NButton quaternary data-testid="statement-duplicate-cancel" @click="emit('cancel')">
          {{ $t("common.cancel") }}
        </NButton>
        <NButton data-testid="statement-duplicate-ignore" @click="decide('ignore')">
          {{ $t("import.statement.duplicate.ignore") }}
        </NButton>
        <NButton data-testid="statement-duplicate-import" @click="decide('import')">
          {{ $t("import.statement.duplicate.importAnyway") }}
        </NButton>
        <NButton
          type="primary"
          data-testid="statement-duplicate-link"
          @click="decide('link_existing')"
        >
          {{ $t("import.statement.duplicate.useExisting") }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.duplicate__reason {
  margin-bottom: var(--space-4);
}

.duplicate__grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0 0 var(--space-4);
}

.duplicate__row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.duplicate__row dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.duplicate__row dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.duplicate__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.duplicate__label {
  margin-right: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.duplicate__safety {
  margin-bottom: 0;
}

.duplicate__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
