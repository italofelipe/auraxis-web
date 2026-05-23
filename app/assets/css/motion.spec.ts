import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const mainCss = readFileSync(join(process.cwd(), "app/assets/css/main.css"), "utf8");

describe("global motion layer", () => {
  it("defines semantic motion tokens and page transition classes", () => {
    expect(mainCss).toContain("--motion-duration-md");
    expect(mainCss).toContain("--motion-ease-emphasized");
    expect(mainCss).toContain(".auraxis-page-enter-active");
    expect(mainCss).toContain(".motion-stagger > *");
  });

  it("honors reduced-motion preferences", () => {
    expect(mainCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(mainCss).toContain("animation-duration: 1ms !important");
    expect(mainCss).toContain("transition-duration: 1ms !important");
  });
});
