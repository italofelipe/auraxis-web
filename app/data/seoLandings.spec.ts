import { describe, expect, it } from "vitest";
import { getSeoLanding, SEO_LANDINGS, SEO_LANDING_SLUGS } from "./seoLandings";

describe("SEO commercial landings", () => {
  it("covers the MVP2 keyword map without duplicate slugs", () => {
    expect(SEO_LANDING_SLUGS).toEqual([
      "controle-financeiro",
      "financas",
      "insights-financeiros",
      "planejamento-financeiro",
      "analise-financeira",
      "planilha-de-gastos",
      "gestao-financeira",
      "inteligencia-financeira",
    ]);
    expect(new Set(SEO_LANDING_SLUGS).size).toBe(SEO_LANDING_SLUGS.length);
    expect(SEO_LANDINGS).toHaveLength(SEO_LANDING_SLUGS.length);
  });

  it("keeps every landing indexable with unique title, description and H1", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const headings = new Set<string>();

    for (const landing of SEO_LANDINGS) {
      titles.add(landing.title);
      descriptions.add(landing.description);
      headings.add(landing.h1);

      expect(landing.title.toLowerCase()).toContain(landing.keyword.split(" ")[0]);
      expect(landing.description.length).toBeGreaterThan(70);
      expect(landing.h1.length).toBeGreaterThan(20);
      expect(landing.proofPoints.length).toBeGreaterThanOrEqual(3);
      expect(landing.highlights.length).toBeGreaterThanOrEqual(3);
      expect(landing.workflow.length).toBeGreaterThanOrEqual(3);
      expect(landing.faq.length).toBeGreaterThanOrEqual(3);
      expect(landing.relatedLinks.map((link) => link.to)).toContain(`/${landing.slug}`);
      expect(getSeoLanding(landing.slug)).toBe(landing);
    }

    expect(titles.size).toBe(SEO_LANDINGS.length);
    expect(descriptions.size).toBe(SEO_LANDINGS.length);
    expect(headings.size).toBe(SEO_LANDINGS.length);
  });

  it("returns undefined for unknown commercial slugs", () => {
    expect(getSeoLanding("dashboard")).toBeUndefined();
  });

  it("covers every priority keyword with an exact landing keyword", () => {
    expect(SEO_LANDINGS.map((landing) => landing.keyword)).toEqual([
      "controle financeiro",
      "finanças",
      "insights financeiros",
      "planejamento financeiro",
      "análise financeira",
      "planilha de gastos",
      "gestão financeira",
      "inteligência financeira",
    ]);
  });
});
