import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import BaseCard from "./BaseCard.vue";

describe("BaseCard", () => {
  it("renderiza titulo e slots", () => {
    const wrapper = mount(BaseCard, {
      props: {
        title: "Titulo",
      },
      slots: {
        default: "<p>Corpo</p>",
      },
    });

    expect(wrapper.text()).toContain("Titulo");
    expect(wrapper.text()).toContain("Corpo");
  });

  it("nao renderiza header quando titulo nao existe", () => {
    const wrapper = mount(BaseCard, {
      slots: {
        default: "<p>Sem titulo</p>",
      },
    });

    expect(wrapper.find("header").exists()).toBe(false);
  });
});
