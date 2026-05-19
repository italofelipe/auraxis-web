import { describe, expect, it } from "vitest";

import {
  buildConsentViewModels,
  formatPrivacyDate,
  latestConsentByKind,
} from "./privacy-center";

describe("privacy-center model", () => {
  it("keeps the latest consent record per kind", () => {
    const latest = latestConsentByKind([
      { kind: "ai", action: "granted", created_at: "2026-05-16T10:00:00Z" },
      { kind: "ai", action: "revoked", created_at: "2026-05-17T10:00:00Z" },
      { kind: "terms", action: "granted", created_at: "2026-05-15T10:00:00Z" },
    ]);

    expect(latest.get("ai")?.action).toBe("revoked");
    expect(latest.get("terms")?.action).toBe("granted");
  });

  it("builds ordered consent view models with inactive fallbacks", () => {
    const rows = buildConsentViewModels([
      {
        kind: "ai",
        action: "granted",
        version: "1.0",
        source: "web",
        created_at: "2026-05-17T12:00:00Z",
      },
    ]);

    expect(rows.map((row) => row.kind)).toEqual([
      "terms",
      "privacy",
      "cookies",
      "ai",
      "marketing",
    ]);
    expect(rows.find((row) => row.kind === "ai")).toMatchObject({
      label: "Insights com IA",
      granted: true,
      version: "1.0",
      source: "web",
    });
    expect(rows.find((row) => row.kind === "terms")?.granted).toBe(false);
  });

  it("formats invalid or absent dates as a dash", () => {
    expect(formatPrivacyDate(null)).toBe("—");
    expect(formatPrivacyDate("not-a-date")).toBe("—");
  });
});
