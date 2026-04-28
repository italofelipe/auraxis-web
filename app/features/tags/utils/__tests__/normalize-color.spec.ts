import { describe, expect, it } from "vitest";

import { stripHexAlpha } from "../normalize-color";

describe("stripHexAlpha", () => {
  it("returns null for null input", () => {
    expect(stripHexAlpha(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(stripHexAlpha(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(stripHexAlpha("")).toBeNull();
  });

  it("strips alpha channel from #RRGGBBAA", () => {
    expect(stripHexAlpha("#C21717FF")).toBe("#C21717");
    expect(stripHexAlpha("#9B59B6CC")).toBe("#9B59B6");
    expect(stripHexAlpha("#abcdef00")).toBe("#abcdef");
  });

  it("preserves canonical 6-digit hex", () => {
    expect(stripHexAlpha("#FF6B6B")).toBe("#FF6B6B");
    expect(stripHexAlpha("#000000")).toBe("#000000");
  });

  it("returns malformed input unchanged for backend validation to reject", () => {
    expect(stripHexAlpha("red")).toBe("red");
    expect(stripHexAlpha("#XYZ")).toBe("#XYZ");
  });
});
