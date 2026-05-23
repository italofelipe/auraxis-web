import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/assets/css/main.css"), "utf8");

describe("global theme CSS variables", () => {
  it("uses light colors as the root default", () => {
    const darkThemeIndex = css.indexOf(":root[data-theme=\"dark\"]");
    const rootThemeCss = css.slice(0, darkThemeIndex);

    expect(rootThemeCss).toMatch(/--color-bg-base:\s*#f4f8fb;/i);
    expect(rootThemeCss).toMatch(/--color-bg-surface:\s*#ffffff;/i);
    expect(rootThemeCss).toMatch(/--color-text-primary:\s*#0a1628;/i);
    expect(rootThemeCss).not.toMatch(/--color-bg-base:\s*#05070d;/i);
  });

  it("keeps dark colors behind the explicit dark theme selector", () => {
    const darkThemeIndex = css.indexOf(":root[data-theme=\"dark\"]");
    const darkThemeCss = css.slice(darkThemeIndex);

    expect(darkThemeIndex).toBeGreaterThan(-1);
    expect(darkThemeCss).toMatch(/--color-bg-base:\s*#05070d;/i);
    expect(darkThemeCss).toMatch(/--color-text-primary:\s*#f1f5ff;/i);
  });
});
