import { describe, it, expect } from "vitest";
import { LayoutDashboard } from "lucide-vue-next";
import { ICON_MAP } from "../iconMap";
import type { AuraxisIconName } from "../icons.types";

const ALL_ICON_NAMES: AuraxisIconName[] = [
  "dashboard", "wallet", "goals", "tools", "transactions", "analytics",
  "settings", "logout", "user", "notifications", "plus", "minus", "search",
  "close", "chevronRight", "chevronDown", "trendingUp", "trendingDown",
  "eye", "eyeOff", "check", "warning", "info", "upload", "download",
  "filter", "calendar", "menu",
];

describe("ICON_MAP", () => {
  it("has all AuraxisIconName keys", () => {
    for (const name of ALL_ICON_NAMES) {
      expect(ICON_MAP).toHaveProperty(name);
    }
  });

  it("all values are defined (not undefined)", () => {
    for (const name of ALL_ICON_NAMES) {
      expect(ICON_MAP[name]).toBeDefined();
    }
  });

  it("dashboard maps to LayoutDashboard", () => {
    expect(ICON_MAP.dashboard).toBe(LayoutDashboard);
  });
});
