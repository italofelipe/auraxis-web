<script setup lang="ts">
import { Sparkles } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import { useAiChat } from "~/features/ai-chat/composables/use-ai-chat";

import AiChatDrawer from "./AiChatDrawer.vue";

const { t } = useI18n();
const { isOpen, isEnabled, isPremium, messages, isSending, errorKind, open, ask, dismissError } =
  useAiChat();
</script>

<template>
  <div v-if="isEnabled" class="ai-chat-widget">
    <button
      v-if="!isOpen"
      type="button"
      class="ai-chat-widget__launcher"
      :aria-label="t('aiChat.launcher')"
      data-testid="ai-chat-launcher"
      @click="open"
    >
      <Sparkles :size="22" aria-hidden="true" />
    </button>

    <AiChatDrawer
      :open="isOpen"
      :is-premium="isPremium"
      :messages="messages"
      :is-sending="isSending"
      :error-kind="errorKind"
      @update:open="isOpen = $event"
      @submit="ask"
      @pick="ask"
      @dismiss-error="dismissError"
    />
  </div>
</template>

<style scoped>
.ai-chat-widget__launcher {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: 1500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-brand-500);
  color: var(--color-text-on-brand);
  box-shadow: var(--shadow-brand-glow);
  cursor: pointer;
  transition:
    transform var(--motion-duration-sm) ease,
    background var(--motion-duration-sm) ease;
}
.ai-chat-widget__launcher:hover {
  background: var(--color-brand-600);
  transform: translateY(-2px);
}
.ai-chat-widget__launcher:focus-visible {
  outline: 2px solid var(--color-brand-300);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .ai-chat-widget__launcher {
    transition: none;
  }
}
</style>
