import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import InstallmentVsCashActionBar from "./InstallmentVsCashActionBar.vue";

const stubs = {
  NButton: {
    props: ["type", "size", "loading", "disabled", "ghost"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NTag: {
    props: ["size", "round", "type"],
    template: "<span class='n-tag'><slot /></span>",
  },
};

describe("InstallmentVsCashActionBar", () => {
  it("renders the save CTA and premium helper copy", () => {
    const wrapper = mount(InstallmentVsCashActionBar, {
      props: {
        isAuthenticated: false,
        hasPremiumAccess: false,
        isSaving: false,
        isBridging: false,
        hasSavedSimulation: false,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Salvar simulação");
    expect(wrapper.text()).toContain("Faça login para desbloquear meta");
  });

  it("shows the saved badge once a simulation exists", () => {
    const wrapper = mount(InstallmentVsCashActionBar, {
      props: {
        isAuthenticated: true,
        hasPremiumAccess: true,
        isSaving: false,
        isBridging: false,
        hasSavedSimulation: true,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Simulação salva");
    expect(wrapper.text()).toContain("Pronta para reaproveitar");
  });
});
