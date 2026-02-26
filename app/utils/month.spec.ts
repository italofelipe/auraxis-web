import { describe, expect, it } from "vitest";

import { formatMonth } from "./month";

describe("formatMonth", () => {
  it("formata mes e ano para pt-BR", () => {
    expect(formatMonth("2026-02").toLowerCase()).toContain("2026");
  });
});
