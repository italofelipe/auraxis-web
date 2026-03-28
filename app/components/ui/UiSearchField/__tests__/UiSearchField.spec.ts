import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiSearchField from "../UiSearchField.vue";

describe("UiSearchField", () => {
  it("renders Search icon always", () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "" },
    });
    expect(wrapper.find(".ui-search-field__icon").exists()).toBe(true);
  });

  it("clear button absent when value is empty", () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "" },
    });
    expect(wrapper.find(".ui-search-field__clear").exists()).toBe(false);
  });

  it("clear button present when value has content", () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "bitcoin" },
    });
    expect(wrapper.find(".ui-search-field__clear").exists()).toBe(true);
  });

  it("emits update:modelValue on input", async () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "" },
    });
    const input = wrapper.find("input");
    await input.setValue("ethereum");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["ethereum"]);
  });

  it("emits clear and empty string on clear button click", async () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "bitcoin" },
    });
    const clearBtn = wrapper.find("button[aria-label=\"Limpar busca\"]");
    expect(clearBtn.exists()).toBe(true);
    await clearBtn.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual([""]);
    expect(wrapper.emitted("clear")).toBeTruthy();
  });

  it("applies disabled class when disabled", () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "", disabled: true },
    });
    expect(wrapper.find(".ui-search-field--disabled").exists()).toBe(true);
  });

  it("input has aria-label=\"Buscar\"", () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "" },
    });
    expect(wrapper.find("input").attributes("aria-label")).toBe("Buscar");
  });

  it("uses custom placeholder", () => {
    const wrapper = mount(UiSearchField, {
      props: { modelValue: "", placeholder: "Pesquisar ativo..." },
    });
    expect(wrapper.find("input").attributes("placeholder")).toBe("Pesquisar ativo...");
  });
});
