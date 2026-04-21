import { describe, expect, it } from "vitest";

import {
  getEnabledTools,
  getEnabledToolsByCategory,
  TOOL_CATEGORY_ORDER,
  TOOLS_CATALOG,
} from "./tools-catalog";
import { mapToolDtoToModel } from "./tools";
import type { ToolDto } from "~/features/tools/contracts/tools.dto";
import { TOOL_SLUGS } from "~/data/tools";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid ToolDto for regression testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete ToolDto fixture.
 */
const makeToolDto = (overrides: Partial<ToolDto> = {}): ToolDto => ({
  id: "some-tool",
  name: "Some Tool",
  description: "A tool for testing.",
  enabled: true,
  requires_auth: false,
  requires_premium: false,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TOOLS_CATALOG", () => {
  it("contains at least one tool", () => {
    expect(TOOLS_CATALOG.length).toBeGreaterThan(0);
  });

  it("stays in parity with TOOL_SLUGS used by nuxt.config prerender", () => {
    const catalogIds = [...TOOLS_CATALOG.map((t) => t.id)].sort();
    const slugList = [...TOOL_SLUGS].sort();
    expect(slugList).toEqual(catalogIds);
  });

  it("each tool has a non-empty id", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(tool.id).toBeTruthy();
    }
  });

  it("each tool has a non-empty name", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(tool.name).toBeTruthy();
    }
  });

  it("each tool has a valid route starting with /tools/", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(tool.route).toMatch(/^\/tools\/.+/);
    }
  });

  it("each tool route matches its id", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(tool.route).toBe(`/tools/${tool.id}`);
    }
  });
});

describe("getEnabledTools", () => {
  it("returns only enabled tools", () => {
    const enabled = getEnabledTools();
    for (const tool of enabled) {
      expect(tool.enabled).toBe(true);
    }
  });

  it("returns a subset of TOOLS_CATALOG", () => {
    const enabled = getEnabledTools();
    expect(enabled.length).toBeLessThanOrEqual(TOOLS_CATALOG.length);
  });

  it("includes installment-vs-cash as an enabled tool", () => {
    const enabled = getEnabledTools();
    const ids = enabled.map((t) => t.id);
    expect(ids).toContain("installment-vs-cash");
  });
});

describe("getEnabledToolsByCategory", () => {
  it("groups enabled tools by declared category", () => {
    const groups = getEnabledToolsByCategory();
    for (const group of groups) {
      for (const tool of group.tools) {
        expect(tool.category ?? "utilidades").toBe(group.category);
      }
    }
  });

  it("orders groups according to TOOL_CATEGORY_ORDER", () => {
    const groups = getEnabledToolsByCategory();
    const categories = groups.map((g) => g.category);
    const expected = TOOL_CATEGORY_ORDER.filter((c) => categories.includes(c));
    expect(categories).toEqual(expected);
  });

  it("preserves the full set of enabled tools", () => {
    const enabled = getEnabledTools();
    const flattened = getEnabledToolsByCategory().flatMap((g) => g.tools);
    expect(flattened.length).toBe(enabled.length);
  });

  it("omits categories that have no enabled tool", () => {
    const groups = getEnabledToolsByCategory();
    for (const group of groups) {
      expect(group.tools.length).toBeGreaterThan(0);
    }
  });
});

describe("TOOLS_CATALOG categories", () => {
  it("every entry declares a category", () => {
    for (const tool of TOOLS_CATALOG) {
      expect(tool.category).toBeDefined();
    }
  });
});

describe("mapToolDtoToModel — regression", () => {
  it("maps a public tool dto correctly", () => {
    const dto = makeToolDto({ id: "my-tool", name: "My Tool" });
    const tool = mapToolDtoToModel(dto);

    expect(tool.id).toBe("my-tool");
    expect(tool.name).toBe("My Tool");
    expect(tool.accessLevel).toBe("public");
    expect(tool.route).toBe("/tools/my-tool");
  });

  it("maps requires_auth=true to authenticated access level", () => {
    const dto = makeToolDto({ requires_auth: true, requires_premium: false });
    const tool = mapToolDtoToModel(dto);
    expect(tool.accessLevel).toBe("authenticated");
  });

  it("maps requires_premium=true to premium access level", () => {
    const dto = makeToolDto({ requires_auth: false, requires_premium: true });
    const tool = mapToolDtoToModel(dto);
    expect(tool.accessLevel).toBe("premium");
  });

  it("derives route from dto id", () => {
    const dto = makeToolDto({ id: "compound-interest" });
    const tool = mapToolDtoToModel(dto);
    expect(tool.route).toBe("/tools/compound-interest");
  });
});
