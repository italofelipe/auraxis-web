import { type VueWrapper, mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import type { ChatMessage } from "~/features/ai-chat/model/ai-chat";

import AiChatDrawer from "./AiChatDrawer.vue";

const stubs = {
  UiBottomSheet: {
    props: ["modelValue"],
    template:
      "<div class='sheet'><slot name='header' /><slot /><slot name='footer' /></div>",
  },
  UiUpgradePrompt: {
    props: ["featureName", "description", "ctaLabel"],
    template: "<div data-testid='upgrade'>{{ featureName }}</div>",
  },
  AiChatMessageList: {
    props: ["messages", "isSending"],
    emits: ["pick"],
    template: "<div data-testid='list' />",
  },
  AiChatComposer: {
    name: "AiChatComposer",
    props: ["disabled"],
    emits: ["submit"],
    template: "<div data-testid='composer' />",
  },
  NButton: { template: "<button @click=\"$emit('click')\"><slot /></button>" },
  Sparkles: true,
  X: true,
};

const messages: ChatMessage[] = [
  { id: "1", role: "user", content: "oi", createdAt: "2026-06-30T12:00:00.000Z" },
];

/**
 * Mounts the drawer with sensible open defaults.
 *
 * @param props Prop overrides.
 * @returns The mounted wrapper.
 */
const mountDrawer = (
  props: Partial<InstanceType<typeof AiChatDrawer>["$props"]>,
): VueWrapper =>
  mount(AiChatDrawer, {
    props: {
      open: true,
      isPremium: true,
      messages,
      isSending: false,
      errorKind: null,
      ...props,
    },
    global: { stubs },
  });

describe("AiChatDrawer", () => {
  it("shows the upgrade prompt and hides the composer for non-Premium users", () => {
    const wrapper = mountDrawer({ isPremium: false });

    expect(wrapper.find("[data-testid='upgrade']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='composer']").exists()).toBe(false);
  });

  it("shows the transcript and composer for Premium users", () => {
    const wrapper = mountDrawer({ isPremium: true });

    expect(wrapper.find("[data-testid='list']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='composer']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='upgrade']").exists()).toBe(false);
  });

  it("renders the localized error message for the current error kind", () => {
    const wrapper = mountDrawer({ errorKind: "budget" });

    expect(wrapper.find(".ai-chat-drawer__error").text()).toContain("limite diário");
  });

  it("forwards the composer submit event", () => {
    const wrapper = mountDrawer({});

    wrapper.findComponent({ name: "AiChatComposer" }).vm.$emit("submit", "Quanto gastei?");

    expect(wrapper.emitted("submit")?.[0]).toEqual(["Quanto gastei?"]);
  });

  it("requests close when the header close button is clicked", async () => {
    const wrapper = mountDrawer({});

    await wrapper.find(".ai-chat-drawer__close").trigger("click");

    expect(wrapper.emitted("update:open")?.[0]).toEqual([false]);
  });
});
