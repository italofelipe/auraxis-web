import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import UiUpgradePrompt from "./UiUpgradePrompt.vue";

const pushMock = vi.fn();

vi.mock("#app", () => ({
  useRouter: (): { push: typeof pushMock } => ({ push: pushMock }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

vi.mock("lucide-vue-next", () => ({
  Lock: { template: "<span class='lock-icon' />" },
}));

const stubs = {
  NButton: {
    template: "<button class='n-button' @click=\"$emit('click')\"><slot /></button>",
    emits: ["click"],
  },
};

describe("UiUpgradePrompt", () => {
  it("renders the title and description from i18n keys", () => {
    const wrapper = mount(UiUpgradePrompt, {
      global: { stubs },
    });

    expect(wrapper.text()).toContain("paywall.upgradePrompt.title");
    expect(wrapper.text()).toContain("paywall.upgradePrompt.description");
  });

  it("renders featureName badge when provided", () => {
    const wrapper = mount(UiUpgradePrompt, {
      props: { featureName: "Simulações Avançadas" },
      global: { stubs },
    });

    expect(wrapper.find(".ui-upgrade-prompt__feature-name").text()).toBe("Simulações Avançadas");
  });

  it("does not render featureName badge when omitted", () => {
    const wrapper = mount(UiUpgradePrompt, {
      global: { stubs },
    });

    expect(wrapper.find(".ui-upgrade-prompt__feature-name").exists()).toBe(false);
  });

  it("uses custom description when provided", () => {
    const wrapper = mount(UiUpgradePrompt, {
      props: { description: "Recurso exclusivo para assinantes Pro." },
      global: { stubs },
    });

    expect(wrapper.find(".ui-upgrade-prompt__description").text()).toBe(
      "Recurso exclusivo para assinantes Pro."
    );
  });

  it("uses custom ctaLabel when provided", () => {
    const wrapper = mount(UiUpgradePrompt, {
      props: { ctaLabel: "Assinar agora" },
      global: { stubs },
    });

    expect(wrapper.find(".n-button").text()).toBe("Assinar agora");
  });

  it("falls back to i18n ctaLabel when ctaLabel is omitted", () => {
    const wrapper = mount(UiUpgradePrompt, {
      global: { stubs },
    });

    expect(wrapper.find(".n-button").text()).toBe("paywall.upgradePrompt.ctaLabel");
  });

  it("navigates to /plans when CTA is clicked", async () => {
    pushMock.mockResolvedValue(undefined);

    const wrapper = mount(UiUpgradePrompt, {
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    expect(pushMock).toHaveBeenCalledWith("/plans");
  });

  it("renders the lock icon", () => {
    const wrapper = mount(UiUpgradePrompt, {
      global: { stubs },
    });

    expect(wrapper.find(".lock-icon").exists()).toBe(true);
  });
});
