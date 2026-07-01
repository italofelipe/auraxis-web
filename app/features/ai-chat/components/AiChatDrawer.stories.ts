import type { Meta, StoryObj } from "@storybook/vue3";

import type { ChatMessage } from "~/features/ai-chat/model/ai-chat";

import AiChatDrawer from "./AiChatDrawer.vue";

const conversation: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "Quanto gastei com alimentação este mês?",
    createdAt: "2026-06-30T12:00:00.000Z",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Até agora, em junho, você gastou R$ 842,30 com alimentação — cerca de 18% dos seus gastos do mês. O maior lançamento foi um mercado de R$ 236,90 no dia 12.",
    createdAt: "2026-06-30T12:00:03.000Z",
  },
  {
    id: "3",
    role: "user",
    content: "E isso está acima do normal?",
    createdAt: "2026-06-30T12:00:20.000Z",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "Está um pouco acima: nos últimos 3 meses sua média foi de R$ 690,00. O aumento veio principalmente de delivery nas últimas duas semanas.",
    createdAt: "2026-06-30T12:00:24.000Z",
  },
];

/**
 * The "Ask Anything" chat drawer. Presentational component driven entirely by
 * props: it renders the Premium gate, transcript, composer and inline error
 * banner. The real feature mounts it via `AiChatWidget` + `useAiChat`.
 */
const meta: Meta<typeof AiChatDrawer> = {
  title: "AI Chat/AiChatDrawer",
  component: AiChatDrawer,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    isPremium: true,
    messages: [],
    isSending: false,
    errorKind: null,
  },
};

export default meta;

type Story = StoryObj<typeof AiChatDrawer>;

/** Premium user, empty transcript — shows the suggestion prompt with examples. */
export const PremiumEmpty: Story = {
  args: { isPremium: true, messages: [] },
};

/** Premium user mid-conversation — user/assistant bubbles. */
export const PremiumConversation: Story = {
  args: { isPremium: true, messages: conversation },
};

/** Premium user waiting for an answer — typing indicator. */
export const PremiumThinking: Story = {
  args: { isPremium: true, messages: conversation.slice(0, 3), isSending: true },
};

/** Non-Premium user — the upgrade prompt replaces the chat. */
export const NonPremium: Story = {
  args: { isPremium: false, messages: [] },
};

/** Daily quota exhausted — inline error banner above the composer. */
export const BudgetError: Story = {
  args: { isPremium: true, messages: conversation.slice(0, 2), errorKind: "budget" },
};
