import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { ChatMessage } from "~/features/ai-chat/model/ai-chat";

import AiChatMessageList from "./AiChatMessageList.vue";

const stubs = { Sparkles: true };

/**
 * Builds a ChatMessage fixture, overriding only the fields under test.
 *
 * @param overrides Partial message overrides.
 * @returns A complete ChatMessage.
 */
const buildMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "m-1",
  role: "user",
  content: "Olá",
  createdAt: "2026-06-30T12:00:00.000Z",
  ...overrides,
});

describe("AiChatMessageList", () => {
  it("renders the suggestion prompt with clickable examples when empty", async () => {
    const wrapper = mount(AiChatMessageList, { props: { messages: [] }, global: { stubs } });

    const examples = wrapper.findAll(".ai-chat-messages__example");
    expect(examples.length).toBe(3);

    await examples[0]!.trigger("click");
    expect(wrapper.emitted("pick")?.[0]?.[0]).toBe("Quanto gastei com alimentação este mês?");
  });

  it("renders user and assistant bubbles", () => {
    const wrapper = mount(AiChatMessageList, {
      props: {
        messages: [
          buildMessage({ id: "1", role: "user", content: "oi" }),
          buildMessage({ id: "2", role: "assistant", content: "olá, tudo bem?" }),
        ],
      },
      global: { stubs },
    });

    expect(wrapper.findAll(".ai-chat-messages__bubble").length).toBe(2);
    expect(wrapper.find(".ai-chat-messages__bubble--user").text()).toContain("oi");
    expect(wrapper.find(".ai-chat-messages__bubble--assistant").text()).toContain("tudo bem");
  });

  it("shows the typing indicator while sending", () => {
    const wrapper = mount(AiChatMessageList, {
      props: { messages: [buildMessage()], isSending: true },
      global: { stubs },
    });

    expect(wrapper.find(".ai-chat-messages__typing").exists()).toBe(true);
  });
});

describe("AiChatMessageList — period chip (#1548)", () => {
  it("renders the anchored-period chip on assistant messages that carry it", () => {
    const wrapper = mount(AiChatMessageList, {
      props: {
        messages: [
          buildMessage({
            role: "assistant",
            content: "Seu salário de julho foi R$ 10.754,00.",
            periodLabel: "julho/2026",
          }),
        ],
      },
      global: { stubs },
    });

    const chip = wrapper.find("[data-testid='chat-period-chip']");
    expect(chip.exists()).toBe(true);
    expect(chip.text()).toContain("julho/2026");
  });

  it("renders no chip when the message has no periodLabel", () => {
    const wrapper = mount(AiChatMessageList, {
      props: {
        messages: [
          buildMessage({ role: "assistant", content: "Você gastou R$ 120,00 hoje." }),
        ],
      },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='chat-period-chip']").exists()).toBe(false);
  });
});
