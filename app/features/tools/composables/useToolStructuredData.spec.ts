import { describe, expect, it } from "vitest";

import {
  buildToolStructuredData,
  buildToolStructuredDataScripts,
} from "./useToolStructuredData";
import type { ToolStructuredDataInput } from "~/features/tools/model/structured-data.types";

const baseInput: ToolStructuredDataInput = {
  name: "Calculadora X",
  description: "Uma calculadora de teste.",
  url: "https://app.auraxis.com.br/tools/x",
};

describe("buildToolStructuredData", () => {
  it("builds a valid WebApplication schema with Brazilian defaults", () => {
    const payload = buildToolStructuredData(baseInput);

    expect(payload.webApplication).toEqual({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Calculadora X",
      description: "Uma calculadora de teste.",
      url: "https://app.auraxis.com.br/tools/x",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "BRL",
      },
    });
  });

  it("respects a custom language tag when provided", () => {
    const payload = buildToolStructuredData({ ...baseInput, inLanguage: "en" });
    expect(payload.webApplication.inLanguage).toBe("en");
  });

  it("builds a FAQPage schema when at least three FAQs are provided", () => {
    const payload = buildToolStructuredData({
      ...baseInput,
      faqs: [
        { question: "Q1?", answer: "A1" },
        { question: "Q2?", answer: "A2" },
        { question: "Q3?", answer: "A3" },
      ],
    });

    expect(payload.faqPage).not.toBeNull();
    expect(payload.faqPage?.mainEntity).toHaveLength(3);
    expect(payload.faqPage?.mainEntity[0]).toEqual({
      "@type": "Question",
      name: "Q1?",
      acceptedAnswer: { "@type": "Answer", text: "A1" },
    });
  });

  it("returns null FAQPage when no FAQs are provided (minimal fallback)", () => {
    const payload = buildToolStructuredData(baseInput);
    expect(payload.faqPage).toBeNull();
  });

  it("returns null FAQPage when an empty list is passed", () => {
    const payload = buildToolStructuredData({ ...baseInput, faqs: [] });
    expect(payload.faqPage).toBeNull();
  });

  it("builds a BreadcrumbList schema with 1-based positions", () => {
    const payload = buildToolStructuredData({
      ...baseInput,
      breadcrumbs: [
        { name: "Início", url: "https://app.auraxis.com.br/" },
        { name: "Ferramentas", url: "https://app.auraxis.com.br/tools" },
        {
          name: "Calculadora X",
          url: "https://app.auraxis.com.br/tools/x",
        },
      ],
    });

    expect(payload.breadcrumbList).not.toBeNull();
    expect(payload.breadcrumbList?.itemListElement).toHaveLength(3);
    expect(payload.breadcrumbList?.itemListElement[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Início",
      item: "https://app.auraxis.com.br/",
    });
    expect(payload.breadcrumbList?.itemListElement[2]?.position).toBe(3);
  });

  it("returns null BreadcrumbList when no breadcrumbs are provided", () => {
    const payload = buildToolStructuredData(baseInput);
    expect(payload.breadcrumbList).toBeNull();
  });
});

describe("buildToolStructuredDataScripts", () => {
  it("emits a single WebApplication script when FAQs/breadcrumbs are absent", () => {
    const scripts = buildToolStructuredDataScripts(
      buildToolStructuredData(baseInput),
    );

    expect(scripts).toHaveLength(1);
    expect(scripts[0]?.id).toBe("ld-tool-webapp");
    expect(scripts[0]?.type).toBe("application/ld+json");
    const parsed = JSON.parse(scripts[0]?.children ?? "{}") as {
      "@type": string;
    };
    expect(parsed["@type"]).toBe("WebApplication");
  });

  it("emits all three scripts when FAQs and breadcrumbs are present", () => {
    const scripts = buildToolStructuredDataScripts(
      buildToolStructuredData({
        ...baseInput,
        faqs: [
          { question: "Q?", answer: "A" },
          { question: "Q2?", answer: "A2" },
          { question: "Q3?", answer: "A3" },
        ],
        breadcrumbs: [{ name: "Home", url: "https://x/" }],
      }),
    );

    expect(scripts.map((s) => s.id)).toEqual([
      "ld-tool-webapp",
      "ld-tool-faq",
      "ld-tool-breadcrumb",
    ]);
  });
});
