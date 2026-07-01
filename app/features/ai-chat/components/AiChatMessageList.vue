<script setup lang="ts">
import { computed } from "vue";
import { Sparkles } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import type { ChatMessage } from "~/features/ai-chat/model/ai-chat";

const props = withDefaults(
  defineProps<{
    /** Transcript to render, oldest first. */
    messages: readonly ChatMessage[];
    /** Whether a request is in flight (renders the typing indicator). */
    isSending?: boolean;
  }>(),
  { isSending: false },
);

const emit = defineEmits<{ pick: [question: string] }>();

const { t, tm, rt } = useI18n();

/** Whether the transcript is empty (renders the suggestion prompt). */
const isEmpty = computed(() => props.messages.length === 0);

/** Localized example questions offered when the transcript is empty. */
const examples = computed<string[]>(() => {
  const raw = tm("aiChat.examples") as unknown[];
  return Array.isArray(raw) ? raw.map((entry) => rt(entry as string)) : [];
});
</script>

<template>
  <div class="ai-chat-messages" role="log" aria-live="polite">
    <div v-if="isEmpty" class="ai-chat-messages__empty">
      <Sparkles :size="26" class="ai-chat-messages__empty-icon" aria-hidden="true" />
      <p class="ai-chat-messages__empty-title">{{ t("aiChat.emptyTitle") }}</p>
      <p class="ai-chat-messages__empty-body">{{ t("aiChat.emptyBody") }}</p>
      <ul class="ai-chat-messages__examples">
        <li v-for="(example, index) in examples" :key="index">
          <button type="button" class="ai-chat-messages__example" @click="emit('pick', example)">
            {{ example }}
          </button>
        </li>
      </ul>
    </div>

    <template v-else>
      <div
        v-for="message in messages"
        :key="message.id"
        class="ai-chat-messages__row"
        :class="`ai-chat-messages__row--${message.role}`"
      >
        <div class="ai-chat-messages__bubble" :class="`ai-chat-messages__bubble--${message.role}`">
          {{ message.content }}
        </div>
      </div>
    </template>

    <div v-if="isSending" class="ai-chat-messages__row ai-chat-messages__row--assistant">
      <div class="ai-chat-messages__bubble ai-chat-messages__bubble--assistant ai-chat-messages__typing">
        <span class="ai-chat-messages__dot" />
        <span class="ai-chat-messages__dot" />
        <span class="ai-chat-messages__dot" />
        <span class="ai-chat-messages__sr">{{ t("aiChat.sending") }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-messages {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 220px;
}
.ai-chat-messages__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-2);
}
.ai-chat-messages__empty-icon {
  color: var(--color-brand-500);
}
.ai-chat-messages__empty-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-sm);
  color: var(--color-text-primary);
}
.ai-chat-messages__empty-body {
  margin: 0;
  color: var(--color-text-secondary);
}
.ai-chat-messages__examples {
  list-style: none;
  margin: var(--space-2) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}
.ai-chat-messages__example {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--motion-duration-sm) ease;
}
.ai-chat-messages__example:hover {
  border-color: var(--color-brand-500);
}
.ai-chat-messages__row {
  display: flex;
}
.ai-chat-messages__row--user {
  justify-content: flex-end;
}
.ai-chat-messages__row--assistant {
  justify-content: flex-start;
}
.ai-chat-messages__bubble {
  max-width: 78%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-lg);
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-chat-messages__bubble--user {
  background: var(--color-brand-500);
  color: var(--color-text-on-brand);
  border-bottom-right-radius: var(--radius-xs);
}
.ai-chat-messages__bubble--assistant {
  background: var(--color-bg-subtle);
  color: var(--color-text-primary);
  border-bottom-left-radius: var(--radius-xs);
}
.ai-chat-messages__typing {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.ai-chat-messages__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-text-muted);
  animation: ai-chat-blink 1.2s infinite ease-in-out both;
}
.ai-chat-messages__dot:nth-child(2) {
  animation-delay: 0.2s;
}
.ai-chat-messages__dot:nth-child(3) {
  animation-delay: 0.4s;
}
.ai-chat-messages__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@keyframes ai-chat-blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .ai-chat-messages__dot {
    animation: none;
  }
}
</style>
