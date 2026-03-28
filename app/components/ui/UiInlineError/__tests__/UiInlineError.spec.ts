import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import UiInlineError from "../UiInlineError.vue";

vi.mock("naive-ui", () => ({
  NButton: {
    name: "NButton",
    props: ["size", "secondary"],
    emits: ["click"],
    template: "<button class=\"n-button\" @click=\"$emit('click', $event)\"><slot /></button>",
  },
}));

describe("UiInlineError", () => {
  it("renders with role=alert", () => {
    const wrapper = mount(UiInlineError);
    expect(wrapper.attributes("role")).toBe("alert");
  });

  it("renders the default title when no title prop is given", () => {
    const wrapper = mount(UiInlineError);
    expect(wrapper.find(".ui-inline-error__title").text()).toBe(
      "Não foi possível carregar",
    );
  });

  it("renders a custom title", () => {
    const wrapper = mount(UiInlineError, {
      props: { title: "Erro ao buscar metas" },
    });
    expect(wrapper.find(".ui-inline-error__title").text()).toBe("Erro ao buscar metas");
  });

  it("does not render message when not provided", () => {
    const wrapper = mount(UiInlineError);
    expect(wrapper.find(".ui-inline-error__message").exists()).toBe(false);
  });

  it("renders the message when provided", () => {
    const wrapper = mount(UiInlineError, {
      props: { message: "Timeout ao conectar com o servidor." },
    });
    const msg = wrapper.find(".ui-inline-error__message");
    expect(msg.exists()).toBe(true);
    expect(msg.text()).toContain("Timeout ao conectar com o servidor.");
  });

  it("does not render retry button when retryLabel is not provided", () => {
    const wrapper = mount(UiInlineError);
    expect(wrapper.find(".ui-inline-error__retry").exists()).toBe(false);
  });

  it("renders retry button when retryLabel is provided", () => {
    const wrapper = mount(UiInlineError, {
      props: { retryLabel: "Tentar novamente" },
    });
    expect(wrapper.find(".ui-inline-error__retry").exists()).toBe(true);
    expect(wrapper.find(".ui-inline-error__retry").text()).toBe("Tentar novamente");
  });

  it("emits retry when the retry button is clicked", async () => {
    const wrapper = mount(UiInlineError, {
      props: { retryLabel: "Tentar novamente" },
    });
    await wrapper.find(".n-button").trigger("click");
    expect(wrapper.emitted("retry")).toBeTruthy();
    expect(wrapper.emitted("retry")).toHaveLength(1);
  });

  it("emits retry multiple times on repeated clicks", async () => {
    const wrapper = mount(UiInlineError, {
      props: { retryLabel: "Retry" },
    });
    const btn = wrapper.find(".n-button");
    await btn.trigger("click");
    await btn.trigger("click");
    expect(wrapper.emitted("retry")).toHaveLength(2);
  });

  it("has the ui-inline-error root class", () => {
    const wrapper = mount(UiInlineError);
    expect(wrapper.classes()).toContain("ui-inline-error");
  });

  it("matches snapshot with all props", () => {
    const wrapper = mount(UiInlineError, {
      props: {
        title: "Falha ao carregar portfólio",
        message: "Serviço indisponível (503).",
        retryLabel: "Tentar novamente",
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("matches snapshot with only title", () => {
    const wrapper = mount(UiInlineError, {
      props: { title: "Erro genérico" },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
