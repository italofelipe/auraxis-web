import { describe, expect, it } from "vitest";
import { TOOL_FAQS, getToolFaqs } from "./tool-faqs-registry";

describe("getToolFaqs", () => {
  it("returns the FAQs of a known calculator", () => {
    const faqs = getToolFaqs("rescisao");

    expect(faqs.length).toBeGreaterThanOrEqual(3);
    expect(faqs[0]?.question.endsWith("?")).toBe(true);
    expect(faqs[0]?.answer.length).toBeGreaterThan(40);
  });

  it("returns an empty list for a calculator without FAQs", () => {
    expect(getToolFaqs("conversor-moeda")).toEqual([]);
  });

  it("returns an empty list for an unknown slug", () => {
    expect(getToolFaqs("ferramenta-inexistente")).toEqual([]);
  });

  it("keys every entry by the slug used in the /tools/ route", () => {
    for (const slug of Object.keys(TOOL_FAQS)) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("keeps every registered FAQ answerable and non-empty", () => {
    for (const [slug, faqs] of Object.entries(TOOL_FAQS)) {
      expect(faqs.length, `${slug} has no FAQs`).toBeGreaterThanOrEqual(3);
      for (const faq of faqs) {
        expect(faq.question.trim().length, `${slug} question empty`).toBeGreaterThan(10);
        expect(faq.answer.trim().length, `${slug} answer too short`).toBeGreaterThan(40);
      }
    }
  });
});
