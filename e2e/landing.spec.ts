import { expect, test } from "@playwright/test";

/**
 * E2E — public capture landing (surface `landing`, issue #1165).
 *
 * WHY THE GATE: the shared Playwright webServer (`pnpm preview`) serves
 * whatever build lives in `.output`. The regular CI e2e job builds the APP
 * surface, where `/` renders the login home — the landing only exists in a
 * build made with `NUXT_PUBLIC_SITE_SURFACE=landing`. Rebuilding a second
 * surface inside every e2e run would double the job time, so this spec runs
 * only when the runner explicitly serves a landing build:
 *
 *   NUXT_PUBLIC_SITE_SURFACE=landing NUXT_PUBLIC_SITE_URL=https://auraxis.com.br pnpm build
 *   LANDING_E2E=1 pnpm test:e2e e2e/landing.spec.ts --project=chromium
 *
 * The deploy pipeline (.github/workflows/deploy-landing.yml) runs it as a
 * pre-deploy gate right after generating the landing artifact.
 */
const isLandingBuildServed = process.env.LANDING_E2E === "1";

test.describe("Landing de captação — auraxis.com.br", () => {
  // reason: the suite needs a landing-surface build in .output; on the default
  // app-surface build `/` renders the login home and every assertion here
  // would fail against the wrong artifact. Gated via LANDING_E2E=1 (see doc).
  test.skip(
    !isLandingBuildServed,
    "Requires a landing-surface build in .output (set LANDING_E2E=1) — see header comment.",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the hero with the capture promise and the register CTA", async ({ page }) => {
    await expect(page.getByTestId("landing-hero")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /do caos financeiro à clareza/i }),
    ).toBeVisible();

    const heroCta = page.getByTestId("landing-cta-register");
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute("href", "https://app.auraxis.com.br/register");
  });

  test("keeps the discreet login entry pointing at the product app", async ({ page }) => {
    const loginLink = page.getByTestId("landing-login-link");
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "https://app.auraxis.com.br/login");

    const headerRegister = page.getByTestId("landing-header-register");
    await expect(headerRegister).toHaveAttribute("href", "https://app.auraxis.com.br/register");
  });

  test("renders the problem→solution and AI sections in order", async ({ page }) => {
    const features = page.getByTestId("landing-features");
    await features.scrollIntoViewIfNeeded();
    await expect(features).toBeVisible();
    await expect(
      features.getByRole("heading", { name: /a planilha quebrou/i }),
    ).toBeVisible();
    await expect(features.getByRole("heading", { name: "Transações e cartões" })).toBeVisible();
    await expect(features.getByRole("heading", { name: "Metas" })).toBeVisible();
    await expect(features.getByRole("heading", { name: "Orçamentos" })).toBeVisible();
    await expect(features.getByRole("heading", { name: "Carteira" })).toBeVisible();

    const aiSection = page.getByTestId("landing-ai");
    await aiSection.scrollIntoViewIfNeeded();
    await expect(aiSection).toBeVisible();
    await expect(aiSection.getByRole("heading", { name: "Radar de gastos" })).toBeVisible();
    await expect(aiSection.getByRole("heading", { name: "Chat financeiro" })).toBeVisible();
    await expect(aiSection.getByRole("heading", { name: "Briefing semanal" })).toBeVisible();
  });

  test("shows the landing footer with legal links on the app origin", async ({ page }) => {
    const footer = page.getByTestId("landing-footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    await expect(footer.getByRole("link", { name: "Privacidade" })).toHaveAttribute(
      "href",
      "https://app.auraxis.com.br/privacy",
    );
    await expect(footer.getByRole("link", { name: "Termos de uso" })).toHaveAttribute(
      "href",
      "https://app.auraxis.com.br/terms",
    );
    await expect(footer.getByRole("link", { name: "Suporte" })).toHaveAttribute(
      "href",
      "https://app.auraxis.com.br/support",
    );
  });

  test("does not render the shared app chrome on the landing surface", async ({ page }) => {
    await expect(page.locator(".ui-public-header")).toHaveCount(0);
    await expect(page.locator(".ui-public-footer")).toHaveCount(0);
  });

  test("exposes the capture SEO identity (title, canonical, robots)", async ({ page }) => {
    await expect(page).toHaveTitle("Auraxis — Planner financeiro inteligente com IA");

    const canonical = page.locator("link[rel='canonical']");
    await expect(canonical).toHaveAttribute("href", "https://auraxis.com.br/");

    const robots = page.locator("meta[name='robots']");
    await expect(robots).toHaveAttribute("content", /index/);
    await expect(robots).not.toHaveAttribute("content", /noindex/);
  });
});

test.describe("Landing de captação — visita sem cookies", () => {
  // reason: same LANDING_E2E gate as the suite above — needs the landing build
  // in .output; assertions fail by design against the app-surface artifact.
  test.skip(
    !isLandingBuildServed,
    "Requires a landing-surface build in .output (set LANDING_E2E=1) — see header comment.",
  );

  // Drop the globally-seeded consent cookie: the landing sets no analytics or
  // marketing cookies, so the LGPD banner must not render even on first visit.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("does not show the app cookie banner over the hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-hero")).toBeVisible();
    await expect(
      page.getByRole("region", { name: /preferências de cookies/i }),
    ).toHaveCount(0);
  });
});
