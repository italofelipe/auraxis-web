import { describe, expect, it } from "vitest";

import { visibleAdminNavKeys } from "./admin-nav";

describe("visibleAdminNavKeys", () => {
  it("keeps every surface when all flags are enabled", () => {
    expect(
      visibleAdminNavKeys({ insights: true, operations: true, impersonation: true }),
    ).toEqual(["overview", "users", "insights", "flags", "impersonation"]);
  });

  it("hides insights, flags and impersonation when their flags are off (prod today)", () => {
    expect(
      visibleAdminNavKeys({ insights: false, operations: false, impersonation: false }),
    ).toEqual(["overview", "users"]);
  });

  it("never hides overview and users, which have a live backend", () => {
    for (const insights of [true, false]) {
      for (const operations of [true, false]) {
        for (const impersonation of [true, false]) {
          const keys = visibleAdminNavKeys({ insights, operations, impersonation });
          expect(keys).toContain("overview");
          expect(keys).toContain("users");
        }
      }
    }
  });

  it("maps the operations flag to the flags surface (flags + operations summary page)", () => {
    expect(
      visibleAdminNavKeys({ insights: false, operations: true, impersonation: false }),
    ).toEqual(["overview", "users", "flags"]);
  });
});
