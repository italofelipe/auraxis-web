import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ToolsPage from "./tools.vue";

vi.mock("#app", () => ({
  definePageMeta: vi.fn(),
}));

describe("ToolsPage (/tools) — placeholder", () => {
  it("renders without crashing", () => {
    const wrapper = mount(ToolsPage);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders the placeholder heading", () => {
    const wrapper = mount(ToolsPage);
    expect(wrapper.find("h1").text()).toBe("Ferramentas");
  });

  it("renders the placeholder container", () => {
    const wrapper = mount(ToolsPage);
    expect(wrapper.find(".placeholder-page").exists()).toBe(true);
  });
});
