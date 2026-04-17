<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NIcon, NAlert } from "naive-ui";
import { Save, Check, AlertCircle } from "lucide-vue-next";

import { useSessionStore } from "~/stores/session";
import { captureException } from "~/core/observability";
import { useCreateReceivableMutation } from "~/features/receivables/queries/use-create-receivable-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import type { ToolSaveResultProps, SaveIntent } from "./ToolSaveResult.types";

defineOptions({ name: "ToolSaveResult" });

const props = withDefaults(defineProps<ToolSaveResultProps>(), {
  description: "",
});

const sessionStore = useSessionStore();

const createReceivable = useCreateReceivableMutation();
const createGoal = useCreateGoalMutation();
const createTransaction = useCreateTransactionMutation();

const saveStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const errorMessage = ref("");

const INTENT_LABELS: Record<Exclude<SaveIntent, "none">, string> = {
  receivable: "Salvar como receita",
  expense: "Salvar como despesa",
  goal: "Salvar como meta",
};

const buttonLabel = computed((): string => {
  if (saveStatus.value === "success") { return "Salvo!"; }
  return INTENT_LABELS[props.intent as Exclude<SaveIntent, "none">] ?? "";
});

const isPending = computed((): boolean =>
  createReceivable.isPending.value
  || createGoal.isPending.value
  || createTransaction.isPending.value,
);

const shouldRender = computed((): boolean =>
  props.intent !== "none" && sessionStore.isAuthenticated,
);

/**
 * Formats a centavo integer to BRL decimal string (e.g. 15050 → "150.50").
 * @param centavos Value in centavos.
 * @returns Decimal string suitable for the API.
 */
function centavosToBrl(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

/**
 * Formats today's date as YYYY-MM-DD for API payloads.
 * @returns ISO date string (date portion only).
 */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Dispatches the save action to the correct mutation based on intent.
 */
async function handleSave(): Promise<void> {
  if (saveStatus.value === "loading" || saveStatus.value === "success") {
    return;
  }
  saveStatus.value = "loading";
  errorMessage.value = "";
  try {
    if (props.intent === "receivable") {
      await createReceivable.mutateAsync({
        description: props.label,
        amount: props.amount,
        expected_date: todayIso(),
        category: "tool-calculation",
      });
    } else if (props.intent === "expense") {
      await createTransaction.mutateAsync({
        title: props.label,
        amount: centavosToBrl(props.amount),
        type: "expense",
        due_date: todayIso(),
        description: props.description || undefined,
      });
    } else if (props.intent === "goal") {
      await createGoal.mutateAsync({
        name: props.label,
        target_amount: props.amount,
        description: props.description || undefined,
      });
    }
    saveStatus.value = "success";
  } catch (err) {
    captureException(err, { context: "ToolSaveResult" });
    errorMessage.value = "Erro ao salvar. Tente novamente.";
    saveStatus.value = "error";
  }
}
</script>

<template>
  <div v-if="shouldRender" class="tool-save-result">
    <NButton
      block
      type="primary"
      :loading="isPending"
      :disabled="saveStatus === 'success'"
      @click="handleSave"
    >
      <template #icon>
        <NIcon>
          <Check v-if="saveStatus === 'success'" />
          <AlertCircle v-else-if="saveStatus === 'error'" />
          <Save v-else />
        </NIcon>
      </template>
      {{ buttonLabel }}
    </NButton>

    <NAlert
      v-if="saveStatus === 'error'"
      type="error"
      class="tool-save-result__error"
      :show-icon="false"
    >
      {{ errorMessage }}
    </NAlert>
  </div>
</template>

<style scoped>
.tool-save-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.tool-save-result__error {
  font-size: var(--font-size-xs);
}
</style>
