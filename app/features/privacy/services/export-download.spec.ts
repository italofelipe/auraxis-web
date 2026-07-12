import { afterEach, describe, expect, it, vi } from "vitest";

import { buildExportFilename, downloadJsonFile } from "./export-download";

describe("buildExportFilename", () => {
  it("uses the package generation date when present", () => {
    expect(buildExportFilename("2026-05-17T06:00:00+00:00")).toBe(
      "auraxis-dados-2026-05-17.json",
    );
  });

  it("falls back to today for missing or invalid timestamps", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(buildExportFilename(undefined)).toBe(`auraxis-dados-${today}.json`);
    expect(buildExportFilename("not-a-date")).toBe(`auraxis-dados-${today}.json`);
  });
});

describe("downloadJsonFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an object URL, clicks a download anchor and revokes the URL", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:auraxis-export");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadJsonFile({ metadata: { scope: "lgpd_full_export" } }, "auraxis-dados-2026-07-11.json");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:auraxis-export");

    vi.unstubAllGlobals();
  });
});
