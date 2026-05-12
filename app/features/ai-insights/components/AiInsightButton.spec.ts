import { ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiInsightButton from "./AiInsightButton.vue";

const useAIInsightsMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/ai-insights/composables/useAIInsights", () => ({
  useAIInsights: useAIInsightsMock,
}));

const stubs = {
  AiInsightLoadingModal: {
    props: ["modelValue"],
    template: "<div v-if='modelValue' data-testid='loading-modal' />",
  },
  NButton: {
    props: ["loading"],
    template: "<button :data-loading='loading' @click='$emit(\"click\")'><slot /></button>",
  },
  NModal: {
    props: ["show"],
    template: "<div v-if='show' data-testid='paywall-modal'><slot /></div>",
  },
  Modal: {
    props: ["show"],
    template: "<div v-if='show' data-testid='paywall-modal'><slot /></div>",
  },
  UiUpgradePrompt: {
    props: ["featureName", "description", "ctaLabel"],
    template: "<div data-testid='upgrade-prompt'>{{ featureName }} {{ description }} {{ ctaLabel }}</div>",
  },
};

describe("AiInsightButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the paywall modal for free users without generating", async () => {
    const generate = vi.fn();
    useAIInsightsMock.mockReturnValue({
      hasPremium: ref(false),
      isLoading: ref(false),
      callsRemaining: ref(null),
      generate,
    });

    const wrapper = mount(AiInsightButton, { global: { stubs } });

    await wrapper.find("button").trigger("click");

    expect(generate).not.toHaveBeenCalled();
    expect(wrapper.find("[data-testid='paywall-modal']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Premium");
  });

  it("opens loading modal immediately and generates for premium users", async () => {
    let resolveGenerate: (value: null) => void = vi.fn();
    const generate = vi.fn().mockImplementation(
      () => new Promise<null>((resolve) => {
        resolveGenerate = resolve;
      }),
    );
    useAIInsightsMock.mockReturnValue({
      hasPremium: ref(true),
      isLoading: ref(false),
      callsRemaining: ref(1),
      generate,
    });

    const wrapper = mount(AiInsightButton, { global: { stubs } });

    await wrapper.find("button").trigger("click");

    expect(wrapper.find("[data-testid='loading-modal']").exists()).toBe(true);
    expect(generate).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain("1 de 2 insights restantes hoje");

    resolveGenerate(null);
    await flushPromises();
    expect(wrapper.find("[data-testid='loading-modal']").exists()).toBe(false);
  });
});
