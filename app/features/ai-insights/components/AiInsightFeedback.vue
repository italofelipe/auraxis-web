<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { NButton, NInput, NRate } from "naive-ui";
import { Check, Sparkles } from "lucide-vue-next";

import { useToast } from "~/composables/useToast";
import { useSubmitInsightFeedback } from "~/features/ai-insights/queries/use-submit-insight-feedback";

const props = defineProps<{
  insightId: string;
}>();

const emit = defineEmits<{
  (event: "submitted"): void;
}>();

const toast = useToast();
const mutation = useSubmitInsightFeedback();

const RATING_FIELDS = [
  { key: "relevance", label: "Relevância" },
  { key: "truthfulness", label: "Veracidade" },
  { key: "depth", label: "Profundidade" },
  { key: "usefulness", label: "Utilidade" },
] as const;

type RatingKey = (typeof RATING_FIELDS)[number]["key"];

const ratings = reactive<Record<RatingKey, number>>({
  relevance: 0,
  truthfulness: 0,
  depth: 0,
  usefulness: 0,
});
const comment = ref("");
const submitted = ref(false);

const allRated = computed(() =>
  RATING_FIELDS.every((field) => ratings[field.key] >= 1),
);
const isPending = computed(() => mutation.isPending.value);
const canSubmit = computed(() => allRated.value && !isPending.value && !submitted.value);

/**
 * Submits the four ratings plus the optional comment for the current insight.
 */
const handleSubmit = async (): Promise<void> => {
  if (!canSubmit.value) {
    return;
  }

  const trimmedComment = comment.value.trim();

  try {
    await mutation.mutateAsync({
      insightId: props.insightId,
      feedback: {
        relevance: ratings.relevance,
        truthfulness: ratings.truthfulness,
        depth: ratings.depth,
        usefulness: ratings.usefulness,
        ...(trimmedComment ? { comment: trimmedComment } : {}),
      },
    });
    submitted.value = true;
    toast.success("Obrigado pelo seu feedback!");
    emit("submitted");
  } catch {
    toast.error("Não foi possível enviar seu feedback. Tente novamente.");
  }
};
</script>

<template>
  <section class="ai-insight-feedback" aria-label="Feedback do insight">
    <div v-if="submitted" class="ai-insight-feedback__done" data-testid="feedback-done">
      <Check :size="18" class="ai-insight-feedback__done-icon" />
      <p>Obrigado! Seu feedback ajuda a melhorar os próximos insights.</p>
    </div>

    <template v-else>
      <header class="ai-insight-feedback__header">
        <Sparkles :size="16" />
        <h3 class="ai-insight-feedback__title">O que você achou desse insight?</h3>
      </header>

      <ul class="ai-insight-feedback__ratings">
        <li v-for="field in RATING_FIELDS" :key="field.key" class="ai-insight-feedback__row">
          <span class="ai-insight-feedback__label">{{ field.label }}</span>
          <NRate
            v-model:value="ratings[field.key]"
            :count="5"
            clearable
            :aria-label="field.label"
            :data-testid="`rate-${field.key}`"
          />
        </li>
      </ul>

      <NInput
        v-model:value="comment"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 5 }"
        placeholder="Conte o que achou (opcional)"
        class="ai-insight-feedback__comment"
        data-testid="feedback-comment"
      />

      <NButton
        type="primary"
        :disabled="!canSubmit"
        :loading="isPending"
        data-testid="feedback-submit"
        @click="handleSubmit"
      >
        Enviar feedback
      </NButton>
    </template>
  </section>
</template>

<style scoped>
.ai-insight-feedback {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-elevated) 90%, transparent);
}

.ai-insight-feedback__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}

.ai-insight-feedback__title {
  margin: 0;
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.ai-insight-feedback__ratings {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ai-insight-feedback__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.ai-insight-feedback__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
}

.ai-insight-feedback__done {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}

.ai-insight-feedback__done p {
  margin: 0;
}

.ai-insight-feedback__done-icon {
  color: var(--color-success-500, #16a34a);
}
</style>
