import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiUserMenu from "../UiUserMenu.vue";

describe("UiUserMenu", () => {
  it("dropdown is closed initially", () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    expect(wrapper.find("[role=\"menu\"]").exists()).toBe(false);
  });

  it("dropdown opens when trigger is clicked", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    expect(wrapper.find("[role=\"menu\"]").exists()).toBe(true);
  });

  it("aria-expanded is false when closed", () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    expect(wrapper.find(".ui-user-menu__trigger").attributes("aria-expanded")).toBe("false");
  });

  it("aria-expanded is true when open", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    expect(wrapper.find(".ui-user-menu__trigger").attributes("aria-expanded")).toBe("true");
  });

  it("emits settings when Configurações is clicked", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    const items = wrapper.findAll("[role=\"menuitem\"]");
    await items[0]!.trigger("click");
    expect(wrapper.emitted("settings")).toBeTruthy();
  });

  it("emits logout when Sair is clicked", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    const items = wrapper.findAll("[role=\"menuitem\"]");
    await items[1]!.trigger("click");
    expect(wrapper.emitted("logout")).toBeTruthy();
  });

  it("closes dropdown after emitting settings", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    const items = wrapper.findAll("[role=\"menuitem\"]");
    await items[0]!.trigger("click");
    expect(wrapper.find("[role=\"menu\"]").exists()).toBe(false);
  });

  it("closes dropdown after emitting logout", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    const items = wrapper.findAll("[role=\"menuitem\"]");
    await items[1]!.trigger("click");
    expect(wrapper.find("[role=\"menu\"]").exists()).toBe(false);
  });

  it("displays name initial when no avatarUrl provided", () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva" },
    });
    const fallback = wrapper.find(".ui-user-menu__avatar--fallback");
    expect(fallback.exists()).toBe(true);
    expect(fallback.text()).toBe("J");
  });

  it("displays img element when avatarUrl is provided", () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva", avatarUrl: "https://example.com/avatar.png" },
    });
    const img = wrapper.find("img.ui-user-menu__avatar");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("https://example.com/avatar.png");
    expect(img.attributes("alt")).toBe("João Silva");
  });

  it("does not render fallback when avatarUrl is provided", () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "João Silva", avatarUrl: "https://example.com/avatar.png" },
    });
    expect(wrapper.find(".ui-user-menu__avatar--fallback").exists()).toBe(false);
  });

  it("shows user name in dropdown", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "Maria Santos", description: "Investidora" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    expect(wrapper.find(".ui-user-menu__user-name").text()).toBe("Maria Santos");
  });

  it("shows description in dropdown when provided", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "Maria Santos", description: "Investidora Arrojada" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    expect(wrapper.find(".ui-user-menu__user-desc").text()).toBe("Investidora Arrojada");
  });

  it("does not show description in dropdown when absent", async () => {
    const wrapper = mount(UiUserMenu, {
      props: { name: "Maria Santos" },
    });
    await wrapper.find(".ui-user-menu__trigger").trigger("click");
    expect(wrapper.find(".ui-user-menu__user-desc").exists()).toBe(false);
  });
});
