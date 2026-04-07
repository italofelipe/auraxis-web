import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

/**
 * Accessibility (a11y) gate — auraxis-web
 *
 * Uses axe-core to detect WCAG 2.1 AA violations on all public pages
 * (pages reachable without authentication).
 *
 * Violations at critical/serious severity fail the build; moderate/minor
 * issues are reported as warnings via test annotations.
 *
 * Run locally:
 *   pnpm test:e2e e2e/a11y.spec.ts
 */

const PUBLIC_PAGES = [
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
  { path: "/forgot-password", name: "Forgot Password" },
  { path: "/plans", name: "Plans" },
  { path: "/privacy-policy", name: "Privacy Policy" },
  { path: "/terms-of-service", name: "Terms of Service" },
];

for (const { path, name } of PUBLIC_PAGES) {
  test(`${name} page has no critical or serious a11y violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for main content to be rendered
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      // Exclude third-party widgets injected at runtime (e.g. chat, analytics)
      .exclude("[data-nosnippet]")
      .analyze();

    const critical = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact ?? ""),
    );
    const minor = results.violations.filter((v) =>
      ["moderate", "minor"].includes(v.impact ?? ""),
    );

    if (minor.length > 0) {
      const summary = minor
        .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
        .join("\n");
      test.info().annotations.push({
        type: "a11y-warning",
        description: `${minor.length} moderate/minor a11y issue(s) on ${name}:\n${summary}`,
      });
    }

    expect(
      critical,
      `Found ${critical.length} critical/serious a11y violation(s) on ${name}:\n` +
        critical
          .map(
            (v) =>
              `  [${v.impact}] ${v.id}: ${v.description}\n` +
              `    Nodes: ${v.nodes.map((n) => n.html).join(", ")}`,
          )
          .join("\n"),
    ).toHaveLength(0);
  });
}
