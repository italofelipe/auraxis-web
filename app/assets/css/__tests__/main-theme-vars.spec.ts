import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/assets/css/main.css"), "utf8");

describe("global theme CSS variables", () => {
  it("uses light colors as the root default", () => {
    expect(css).toContain("--color-bg-base:     #F4F8FB;");
    expect(css).toContain("--color-bg-surface:  #FFFFFF;");
    expect(css).toContain("--color-text-primary:   #0A1628;");
  });

  it("keeps dark colors behind the explicit dark theme selector", () => {
    expect(css).toContain(":root[data-theme=\"dark\"]");
    expect(css).toContain("--color-bg-base:     #05070d;");
    expect(css).toContain("--color-text-primary:   #f1f5ff;");
  });
});
