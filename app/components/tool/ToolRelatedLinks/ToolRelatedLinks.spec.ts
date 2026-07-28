import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import ToolRelatedLinks from "./ToolRelatedLinks.vue";

vi.mock("lucide-vue-next", () => ({
  ArrowRight: { template: "<span class='icon-arrow' />" },
}));

const stubs = {
  NuxtLink: {
    template: "<a :href=\"to\"><slot /></a>",
    props: ["to"],
  },
};

/**
 * Mounts the block for a given tool id.
 *
 * @param toolId - Catalog id of the current tool.
 * @returns Mounted wrapper.
 */
const mountBlock = (toolId: string): ReturnType<typeof mount> =>
  mount(ToolRelatedLinks, { props: { toolId }, global: { stubs } });

describe("ToolRelatedLinks", () => {
  it("renders sibling tools and thematic guides", () => {
    const wrapper = mountBlock("rescisao");

    expect(wrapper.find("[data-testid='tool-related-links']").exists()).toBe(true);
    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"));
    expect(hrefs.some((h) => h?.startsWith("/tools/"))).toBe(true);
    expect(hrefs).toContain("/planejamento-financeiro");
  });

  it("never links back to the current tool", () => {
    const wrapper = mountBlock("ferias");

    expect(wrapper.findAll("a").map((a) => a.attributes("href"))).not.toContain("/tools/ferias");
  });

  it("does not render when the tool is unknown", () => {
    const wrapper = mountBlock("ferramenta-inexistente");

    expect(wrapper.find("[data-testid='tool-related-links']").exists()).toBe(false);
  });

  it("does not render without a tool id", () => {
    const wrapper = mountBlock("");

    expect(wrapper.find("[data-testid='tool-related-links']").exists()).toBe(false);
  });

  it("labels both navigation groups for assistive tech", () => {
    const wrapper = mountBlock("juros-compostos");

    const labels = wrapper.findAll("nav").map((n) => n.attributes("aria-label"));
    expect(labels).toContain("Calculadoras relacionadas");
    expect(labels).toContain("Guias relacionados");
  });
});
