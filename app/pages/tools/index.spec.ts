import { describe, expect, it } from "vitest";
import { getEnabledTools, TOOLS_CATALOG } from "~/features/tools/model/tools-catalog";

/**
 * Smoke tests for the Tools page catalog data layer.
 * Full rendering is covered in ToolCatalogCard.spec.ts and tools-catalog.spec.ts.
 * The page component itself requires Nuxt runtime context (useSeoMeta / useHead)
 * which is not available in the happy-dom test environment.
 */
describe("ToolsPage — catalog data layer", () => {
  it("TOOLS_CATALOG has at least one entry", () => {
    expect(TOOLS_CATALOG.length).toBeGreaterThan(0);
  });

  it("getEnabledTools returns at least one enabled tool for the page to render", () => {
    const enabled = getEnabledTools();
    expect(enabled.length).toBeGreaterThan(0);
  });

  it("each enabled tool has the required fields for ToolCatalogCard", () => {
    const enabled = getEnabledTools();
    for (const tool of enabled) {
      expect(tool.id).toBeTruthy();
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.route).toMatch(/^\/tools\/.+/);
      expect(["public", "authenticated", "premium"]).toContain(tool.accessLevel);
    }
  });
});
