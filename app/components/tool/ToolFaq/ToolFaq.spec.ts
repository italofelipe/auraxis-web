import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ToolFaq from "./ToolFaq.vue";
import { getToolFaqs } from "~/features/tools/content/tool-faqs-registry";

/**
 * Mounts the FAQ block for a given tool slug.
 *
 * @param toolId - Slug of the current calculator.
 * @returns Mounted wrapper.
 */
const mountFaq = (toolId: string): ReturnType<typeof mount> =>
  mount(ToolFaq, { props: { toolId } });

describe("ToolFaq", () => {
  it("renders every registered question and answer as visible text", () => {
    const wrapper = mountFaq("rescisao");
    const expected = getToolFaqs("rescisao");

    expect(wrapper.find("[data-testid='tool-faq']").exists()).toBe(true);
    expect(wrapper.findAll("details")).toHaveLength(expected.length);
    // O texto precisa estar no DOM: o FAQPage do JSON-LD só é válido quando
    // espelha conteúdo que o visitante lê.
    for (const faq of expected) {
      expect(wrapper.text()).toContain(faq.question);
      expect(wrapper.text()).toContain(faq.answer);
    }
  });

  it("does not render for a calculator without FAQs", () => {
    expect(mountFaq("conversor-moeda").find("[data-testid='tool-faq']").exists()).toBe(false);
  });

  it("does not render without a tool id", () => {
    expect(mountFaq("").find("[data-testid='tool-faq']").exists()).toBe(false);
  });

  it("uses native disclosure elements so the answer ships in the HTML", () => {
    const wrapper = mountFaq("juros-compostos");

    const first = wrapper.find("details");
    expect(first.exists()).toBe(true);
    expect(first.find("summary").exists()).toBe(true);
  });

  it("labels the section for assistive tech", () => {
    const wrapper = mountFaq("ferias");

    expect(wrapper.find("section").attributes("aria-labelledby")).toBe("tool-faq-title");
    expect(wrapper.find("#tool-faq-title").exists()).toBe(true);
  });
});
