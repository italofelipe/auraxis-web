import { describe, expect, it } from "vitest";

import {
  NOTIFICATION_CATEGORIES,
  isNotificationCategory,
  mapPreferencesResponse,
  toPreferencePayload,
  withDefaultCategories,
} from "./notification-preferences";

describe("notification-preferences model", () => {
  it("recognizes valid categories", () => {
    expect(isNotificationCategory("due_soon")).toBe(true);
    expect(isNotificationCategory("unknown")).toBe(false);
  });

  it("maps the list response, dropping unknown categories", () => {
    const prefs = mapPreferencesResponse({
      preferences: [
        { category: "due_soon", enabled: false, global_opt_out: false },
        { category: "legacy_unknown", enabled: true, global_opt_out: false },
      ],
    });
    expect(prefs).toHaveLength(1);
    expect(prefs[0]).toEqual({ category: "due_soon", enabled: false, globalOptOut: false });
  });

  it("fills missing categories with enabled defaults", () => {
    const full = withDefaultCategories([
      { category: "due_soon", enabled: false, globalOptOut: false },
    ]);
    expect(full).toHaveLength(NOTIFICATION_CATEGORIES.length);
    expect(full.find((p) => p.category === "due_soon")?.enabled).toBe(false);
    expect(full.find((p) => p.category === "goals")?.enabled).toBe(true);
  });

  it("serializes a preference into the PATCH payload shape", () => {
    expect(
      toPreferencePayload({ category: "wallet", enabled: true, globalOptOut: false }),
    ).toEqual({ category: "wallet", enabled: true, global_opt_out: false });
  });
});
