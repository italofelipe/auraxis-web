<script setup lang="ts">
import { computed, ref } from "vue";
import { NInput } from "naive-ui";
import { SendHorizontal } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    /** Disables input and submission while a request is in flight. */
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{ submit: [question: string] }>();

const { t } = useI18n();
const draft = ref("");

/** Whether the current draft can be submitted. */
const canSubmit = computed(() => draft.value.trim().length > 0 && !props.disabled);

/**
 * Emits the trimmed question and clears the draft when submittable.
 */
const onSubmit = (): void => {
  if (!canSubmit.value) {
    return;
  }
  emit("submit", draft.value.trim());
  draft.value = "";
};
</script>

<template>
  <form class="ai-chat-composer" @submit.prevent="onSubmit">
    <NInput
      v-model:value="draft"
      type="textarea"
      class="ai-chat-composer__input"
      :placeholder="t('aiChat.placeholder')"
      :disabled="disabled"
      :autosize="{ minRows: 1, maxRows: 4 }"
      :aria-label="t('aiChat.placeholder')"
      @keydown.enter.exact.prevent="onSubmit"
    />
    <button
      type="submit"
      class="ai-chat-composer__send"
      :disabled="!canSubmit"
      :aria-label="t('aiChat.send')"
    >
      <SendHorizontal :size="18" aria-hidden="true" />
    </button>
  </form>
</template>

<style scoped>
.ai-chat-composer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
}
.ai-chat-composer__input {
  flex: 1;
}
.ai-chat-composer__send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-brand-500);
  color: var(--color-text-on-brand);
  cursor: pointer;
  transition: opacity var(--motion-duration-md) ease;
}
.ai-chat-composer__send:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
