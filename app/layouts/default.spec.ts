import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DefaultLayout from "./default.vue";

describe("DefaultLayout", () => {
  it("exibe branding e navegacao principal", () => {
    const wrapper = mount(DefaultLayout, {
      slots: {
        default: "<p>Conteudo</p>",
      },
      global: {
        stubs: {
          NuxtLink: {
            props: ["to"],
            template: "<a><slot /></a>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Auraxis");
    expect(wrapper.text()).toContain("Dashboard");
    expect(wrapper.text()).toContain("Carteira");
    expect(wrapper.text()).toContain("Ferramentas");
    expect(wrapper.text()).toContain("Conteudo");
  });
});
