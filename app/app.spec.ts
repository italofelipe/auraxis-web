import { shallowMount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import App from "./app.vue";

describe("App bootstrap", () => {
  it("renderiza layout e page container", () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          NuxtLoadingIndicator: true,
          NuxtLayout: {
            template: "<div><slot /></div>",
          },
          NuxtPage: true,
        },
      },
    });

    expect(wrapper.html()).toContain("nuxt-loading-indicator-stub");
    expect(wrapper.html()).toContain("nuxt-page-stub");
  });
});
