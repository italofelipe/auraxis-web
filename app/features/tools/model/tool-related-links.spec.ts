import { describe, expect, it } from "vitest";
import { buildToolRelatedLinks } from "./tool-related-links";
import { TOOLS_CATALOG } from "./tools-catalog";

describe("buildToolRelatedLinks", () => {
  it("suggests sibling tools from the same category", () => {
    const links = buildToolRelatedLinks("rescisao");
    const tools = links.filter((l) => l.kind === "tool");

    expect(tools.length).toBeGreaterThanOrEqual(2);
    for (const link of tools) {
      expect(link.to.startsWith("/tools/")).toBe(true);
      expect(link.to).not.toBe("/tools/rescisao");
    }
  });

  it("never suggests the current tool", () => {
    for (const tool of TOOLS_CATALOG) {
      const links = buildToolRelatedLinks(tool.id);
      expect(links.map((l) => l.to)).not.toContain(tool.route);
    }
  });

  it("includes a thematic guide for every tool", () => {
    for (const tool of TOOLS_CATALOG) {
      const guides = buildToolRelatedLinks(tool.id).filter((l) => l.kind === "guide");
      expect(guides.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("routes the CLT category to the labour-themed guide", () => {
    const guides = buildToolRelatedLinks("ferias").filter((l) => l.kind === "guide");

    expect(guides.map((l) => l.to)).toContain("/planejamento-financeiro");
  });

  it("routes the investment category to the analysis guide", () => {
    const guides = buildToolRelatedLinks("fire").filter((l) => l.kind === "guide");

    expect(guides.map((l) => l.to)).toContain("/analise-financeira");
  });

  it("keeps every destination relative so the apex serves it locally", () => {
    for (const tool of TOOLS_CATALOG) {
      for (const link of buildToolRelatedLinks(tool.id)) {
        expect(link.to.startsWith("/")).toBe(true);
      }
    }
  });

  it("caps the list so the block stays scannable", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(buildToolRelatedLinks(tool.id).length).toBeLessThanOrEqual(5);
    }
  });

  it("returns an empty list for an unknown slug", () => {
    expect(buildToolRelatedLinks("ferramenta-inexistente")).toEqual([]);
  });

  it("labels every link with human-readable text", () => {
    for (const link of buildToolRelatedLinks("juros-compostos")) {
      expect(link.label.length).toBeGreaterThan(3);
    }
  });
});
