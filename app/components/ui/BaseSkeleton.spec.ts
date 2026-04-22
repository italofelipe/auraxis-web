import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import BaseSkeleton from "./BaseSkeleton.vue";

describe("BaseSkeleton", () => {
  it("renderiza placeholder com classe base", () => {
    const wrapper = mount(BaseSkeleton);

    expect(wrapper.get("[data-testid='base-skeleton']").classes()).toContain("base-skeleton");
  });

  it("aplica variante padrão 'line'", () => {
    const wrapper = mount(BaseSkeleton);

    expect(wrapper.get("[data-testid='base-skeleton']").classes()).toContain("base-skeleton--line");
  });

  it("respeita height e width customizados", () => {
    const wrapper = mount(BaseSkeleton, {
      props: { height: "72px", width: "50%" },
    });

    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("height: 72px");
    expect(style).toContain("width: 50%");
  });

  it("aplica preset de altura para variante text", () => {
    const wrapper = mount(BaseSkeleton, { props: { variant: "text" } });

    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("height: 14px");
  });

  it("aplica preset de altura para variante button", () => {
    const wrapper = mount(BaseSkeleton, { props: { variant: "button" } });

    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("height: 36px");
  });

  it("renderiza círculo com size", () => {
    const wrapper = mount(BaseSkeleton, {
      props: { variant: "circle", size: "32px" },
    });

    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("height: 32px");
    expect(style).toContain("width: 32px");
    expect(style).toContain("border-radius: 9999px");
  });

  it("repete N elementos quando repeat > 1", () => {
    const wrapper = mount(BaseSkeleton, { props: { repeat: 4 } });

    expect(wrapper.findAll("[data-testid='base-skeleton']")).toHaveLength(4);
  });

  it("aplica preset de altura para variante card", () => {
    const wrapper = mount(BaseSkeleton, { props: { variant: "card" } });
    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("height: 100px");
  });

  it("aplica preset de altura para variante chart", () => {
    const wrapper = mount(BaseSkeleton, { props: { variant: "chart" } });
    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("height: 180px");
  });

  it("aplica radius md para variante card", () => {
    const wrapper = mount(BaseSkeleton, { props: { variant: "card" } });
    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("border-radius: var(--radius-md");
  });

  it("aplica radius md para variante chart", () => {
    const wrapper = mount(BaseSkeleton, { props: { variant: "chart" } });
    const style = wrapper.get("[data-testid='base-skeleton']").attributes("style") ?? "";
    expect(style).toContain("border-radius: var(--radius-md");
  });

  it("marca todos os placeholders como aria-hidden", () => {
    const wrapper = mount(BaseSkeleton, { props: { repeat: 2 } });

    for (const el of wrapper.findAll("[data-testid='base-skeleton']")) {
      expect(el.attributes("aria-hidden")).toBe("true");
    }
  });
});
