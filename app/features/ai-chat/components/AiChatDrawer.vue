<script setup lang="ts">
import { computed } from "vue";
import { NButton } from "naive-ui";
import { Sparkles, X } from "lucide-vue-next";
import { useI18n } from "vue-i18n";

import UiBottomSheet from "~/components/ui/UiBottomSheet/UiBottomSheet.vue";
import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";
import type { ChatErrorKind, ChatMessage } from "~/features/ai-chat/model/ai-chat";

import AiChatComposer from "./AiChatComposer.vue";
import AiChatMessageList from "./AiChatMessageList.vue";

const props = defineProps<{
  /** Whether the drawer is open (v-model:open). */
  open: boolean;
  /** Whether the user has Premium access to the chat. */
  isPremium: boolean;
  /** Chat transcript, oldest first. */
  messages: readonly ChatMessage[];
  /** Whether a request is in flight. */
  isSending: boolean;
  /** Current classified error, or null. */
  errorKind: ChatErrorKind | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  submit: [question: string];
  "dismiss-error": [];
  pick: [question: string];
}>();

const { t } = useI18n();

/** Localized message for the current error kind, or empty when none. */
const errorMessage = computed<string>(() =>
  props.errorKind ? t(`aiChat.errors.${props.errorKind}`) : "",
);
</script>

<template>
  <UiBottomSheet
    :model-value="open"
    :aria-label="t('aiChat.title')"
    max-width="min(560px, 100vw)"
    max-height="min(760px, 92vh)"
    @update:model-value="emit('update:open', $event)"
  >
    <template #header>
      <div class="ai-chat-drawer__header">
        <div class="ai-chat-drawer__heading">
          <span class="ai-chat-drawer__badge" aria-hidden="true">
            <Sparkles :size="18" />
          </span>
          <div>
            <p class="ai-chat-drawer__title">{{ t("aiChat.title") }}</p>
            <p class="ai-chat-drawer__subtitle">{{ t("aiChat.subtitle") }}</p>
          </div>
        </div>
        <button
          type="button"
          class="ai-chat-drawer__close"
          :aria-label="t('aiChat.close')"
          @click="emit('update:open', false)"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </div>
    </template>

    <UiUpgradePrompt
      v-if="!isPremium"
      :feature-name="t('aiChat.premiumTitle')"
      :description="t('aiChat.premiumBody')"
      :cta-label="t('aiChat.premiumCta')"
    />
    <AiChatMessageList
      v-else
      :messages="messages"
      :is-sending="isSending"
      @pick="emit('pick', $event)"
    />

    <template v-if="isPremium" #footer>
      <div class="ai-chat-drawer__footer">
        <div v-if="errorMessage" class="ai-chat-drawer__error" role="alert">
          <span>{{ errorMessage }}</span>
          <NButton text size="tiny" @click="emit('dismiss-error')">
            {{ t("aiChat.dismiss") }}
          </NButton>
        </div>
        <AiChatComposer :disabled="isSending" @submit="emit('submit', $event)" />
        <p class="ai-chat-drawer__disclaimer">{{ t("aiChat.disclaimer") }}</p>
      </div>
    </template>
  </UiBottomSheet>
</template>

<style scoped>
.ai-chat-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}
.ai-chat-drawer__heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ai-chat-drawer__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  background: var(--color-bg-subtle);
  color: var(--color-brand-500);
}
.ai-chat-drawer__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-sm);
  color: var(--color-text-primary);
}
.ai-chat-drawer__subtitle {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.ai-chat-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}
.ai-chat-drawer__close:hover {
  background: var(--color-bg-subtle);
}
.ai-chat-drawer__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.ai-chat-drawer__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-negative-bg);
  color: var(--color-negative-dark);
  font-size: var(--font-size-xs);
}
.ai-chat-drawer__disclaimer {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
