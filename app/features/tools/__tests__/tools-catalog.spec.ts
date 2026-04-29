import { describe, expect, it } from "vitest";

import {
  TOOLS_CATALOG,
  TOOL_CATEGORY_LABELS,
  TOOL_IDS_LIST,
  isKnownTool,
  type ToolCategory,
} from "../tools-catalog";

describe("tools-catalog", () => {
  it("exposes a non-empty canonical catalog", () => {
    expect(TOOLS_CATALOG.length).toBeGreaterThan(30);
  });

  it("declares each tool with the canonical kebab-case id shape", () => {
    const KEBAB = /^[a-z][a-z0-9-]*$/;
    for (const tool of TOOLS_CATALOG) {
      expect(tool.id).toMatch(KEBAB);
    }
  });

  it("returns ids sorted alphabetically", () => {
    const sorted = [...TOOL_IDS_LIST].sort((a, b) => a.localeCompare(b));
    expect(TOOL_IDS_LIST).toEqual(sorted);
  });

  it("isKnownTool returns true for every catalog entry and false for unknowns", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(isKnownTool(tool.id)).toBe(true);
    }
    expect(isKnownTool("definitely-not-a-real-tool")).toBe(false);
  });

  it("flags installment-vs-cash, thirteenth-salary and overtime as enabled", () => {
    const enabled = TOOLS_CATALOG.filter((t) => t.enabled).map((t) => t.id);
    expect(enabled).toContain("installment-vs-cash");
    expect(enabled).toContain("thirteenth-salary");
    expect(enabled).toContain("overtime");
  });

  it("provides a localized label for each ToolCategory", () => {
    const categories = new Set<ToolCategory>(TOOLS_CATALOG.map((t) => t.category));
    for (const category of categories) {
      expect(TOOL_CATEGORY_LABELS[category]).toBeTruthy();
    }
  });
});
