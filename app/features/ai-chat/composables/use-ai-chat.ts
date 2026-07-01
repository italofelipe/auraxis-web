/**
 * Orchestrates the "Ask Anything" AI chat: open/close state, the in-memory
 * transcript, and the ask action backed by the `POST /ai/chat` mutation.
 *
 * The chat is stateless server-side (single-turn), so the transcript lives in
 * memory for the session. This composable owns NO presentation concern (no
 * i18n, no toast); components render its reactive state and call its actions.
 */

import { type ComputedRef, type Ref, computed, ref } from "vue";

import type { ApiError } from "~/core/errors";
import type { AIChatResponseDTO } from "~/features/ai-chat/contracts/ai-chat";
import type { ChatErrorKind, ChatMessage } from "~/features/ai-chat/model/ai-chat";
import { useAskFinancialQuestion } from "~/features/ai-chat/queries/use-ask-financial-question";
import { classifyChatError } from "~/features/ai-chat/services/ai-chat.errors";
import { isPremiumSubscription } from "~/features/ai-chat/services/ai-chat.eligibility";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

/** Feature flag gating the chat entry point (kill-switch / staged rollout). */
export const AI_CHAT_FLAG = "web.features.ai-chat";

/** Ask mutation shape consumed by the composable (subset used here). */
type AskMutation = {
  readonly mutateAsync: (question: string) => Promise<AIChatResponseDTO>;
};

/** Injectable dependencies, primarily for tests. */
export interface UseAiChatOptions {
  readonly mutation?: AskMutation;
  readonly now?: () => Date;
  readonly createId?: () => string;
}

/** Reactive surface returned by {@link useAiChat}. */
export interface UseAiChatReturn {
  readonly isOpen: Ref<boolean>;
  readonly isEnabled: ComputedRef<boolean>;
  readonly isPremium: ComputedRef<boolean>;
  readonly messages: Ref<readonly ChatMessage[]>;
  readonly isSending: Ref<boolean>;
  readonly errorKind: Ref<ChatErrorKind | null>;
  readonly open: () => void;
  readonly close: () => void;
  readonly dismissError: () => void;
  readonly ask: (question: string) => Promise<void>;
}

let messageSequence = 0;

/**
 * Generates a stable-enough message id, preferring the platform UUID when
 * available and falling back to a monotonic sequence for SSR/tests.
 *
 * @returns A unique message identifier.
 */
const defaultCreateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  messageSequence += 1;
  return `ai-chat-msg-${messageSequence}`;
};

/**
 * AI chat composable (thin façade over the ask mutation and subscription gate).
 *
 * @param options Injectable dependencies for tests (mutation, clock, id factory).
 * @returns Reactive state and actions for the chat widget.
 */
export const useAiChat = (options: UseAiChatOptions = {}): UseAiChatReturn => {
  const flag = useFeatureFlag(AI_CHAT_FLAG);
  const subscriptionQuery = useSubscriptionQuery();
  const isPremium = computed(() => isPremiumSubscription(subscriptionQuery.data.value ?? null));
  const isEnabled = computed(() => flag.value);

  const mutation: AskMutation = options.mutation ?? useAskFinancialQuestion();
  const now = options.now ?? ((): Date => new Date());
  const createId = options.createId ?? defaultCreateId;

  const isOpen = ref(false);
  const messages = ref<ChatMessage[]>([]);
  const isSending = ref(false);
  const errorKind = ref<ChatErrorKind | null>(null);

  /** Opens the chat drawer. */
  const open = (): void => {
    isOpen.value = true;
  };

  /** Closes the chat drawer, preserving the transcript. */
  const close = (): void => {
    isOpen.value = false;
  };

  /** Clears the current error banner. */
  const dismissError = (): void => {
    errorKind.value = null;
  };

  /**
   * Appends a message to the transcript.
   *
   * @param role Author of the message.
   * @param content Rendered text.
   */
  const appendMessage = (role: ChatMessage["role"], content: string): void => {
    messages.value = [
      ...messages.value,
      { id: createId(), role, content, createdAt: now().toISOString() },
    ];
  };

  /**
   * Sends a question to the backend and appends the answer, or classifies the
   * failure into a translatable error kind. No-ops on blank input or while a
   * request is already in flight.
   *
   * @param question Raw question text from the composer.
   */
  const ask = async (question: string): Promise<void> => {
    const trimmed = question.trim();
    if (trimmed.length === 0 || isSending.value) {
      return;
    }

    errorKind.value = null;
    appendMessage("user", trimmed);
    isSending.value = true;

    try {
      const result = await mutation.mutateAsync(trimmed);
      appendMessage("assistant", result.answer);
    } catch (error) {
      errorKind.value = classifyChatError(error as ApiError);
    } finally {
      isSending.value = false;
    }
  };

  return {
    isOpen,
    isEnabled,
    isPremium,
    messages,
    isSending,
    errorKind,
    open,
    close,
    dismissError,
    ask,
  };
};
