import { computed, ref } from "vue";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiChatWidget from "./AiChatWidget.vue";

const useAiChatMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/ai-chat/composables/use-ai-chat", () => ({
  useAiChat: useAiChatMock,
  AI_CHAT_FLAG: "web.features.ai-chat",
}));

const stubs = {
  AiChatDrawer: {
    props: ["open", "isPremium", "messages", "isSending", "errorKind"],
    template: "<div data-testid='drawer' />",
  },
  Sparkles: true,
};

/**
 * Builds a useAiChat return stub, overriding only what a test needs.
 *
 * @param overrides Partial overrides.
 * @returns A complete composable stub.
 */
const buildComposable = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  isOpen: ref(false),
  isEnabled: computed(() => true),
  isPremium: computed(() => true),
  messages: ref([]),
  isSending: ref(false),
  errorKind: ref(null),
  open: vi.fn(),
  ask: vi.fn(),
  dismissError: vi.fn(),
  ...overrides,
});

describe("AiChatWidget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not render the launcher when the feature is disabled", () => {
    useAiChatMock.mockReturnValue(buildComposable({ isEnabled: computed(() => false) }));

    const wrapper = mount(AiChatWidget, { global: { stubs } });

    expect(wrapper.find("[data-testid='ai-chat-launcher']").exists()).toBe(false);
  });

  it("renders the launcher and opens the chat on click", async () => {
    const open = vi.fn();
    useAiChatMock.mockReturnValue(buildComposable({ open }));

    const wrapper = mount(AiChatWidget, { global: { stubs } });

    const launcher = wrapper.find("[data-testid='ai-chat-launcher']");
    expect(launcher.exists()).toBe(true);

    await launcher.trigger("click");
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("hides the launcher while the drawer is open", () => {
    useAiChatMock.mockReturnValue(buildComposable({ isOpen: ref(true) }));

    const wrapper = mount(AiChatWidget, { global: { stubs } });

    expect(wrapper.find("[data-testid='ai-chat-launcher']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='drawer']").exists()).toBe(true);
  });
});
