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

  test("renders the pricing section with plans and the subscribe CTA", async ({ page }) => {
    const pricing = page.getByTestId("landing-pricing");
    await pricing.scrollIntoViewIfNeeded();
    await expect(pricing).toBeVisible();
    await expect(pricing.getByRole("heading", { name: "Premium mensal" })).toBeVisible();
    await expect(pricing.getByRole("heading", { name: "Premium anual" })).toBeVisible();
    await expect(pricing.getByText("R$ 29,90")).toBeVisible();
    await expect(pricing.getByText("R$ 287,04")).toBeVisible();

    // #1187: buying happens on the landing itself — the CTA must NOT hand the
    // visitor to another origin before they can pay.
    const subscribe = page.getByTestId("landing-pricing-subscribe");
    await expect(subscribe).toBeVisible();
    await expect(subscribe).toHaveAttribute("href", "/checkout?plano=anual");
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

  // Drop the globally-seeded consent cookie: with the PostHog key baked into
  // the apex build, the LGPD banner must now render on first visit (#1177) so
  // analytics stays opt-in — while never blocking the hero CTA.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("shows the cookie banner without covering the hero CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("landing-hero")).toBeVisible();

    const banner = page.getByRole("region", { name: /preferências de cookies/i });
    await expect(banner).toBeVisible();

    const heroCta = page.getByTestId("landing-cta-register");
    await expect(heroCta).toBeVisible();
    const ctaBox = await heroCta.boundingBox();
    const bannerBox = await banner.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(bannerBox).not.toBeNull();
    // Compact corner-anchored banner (#1177): its box must not intersect the
    // hero CTA box at all, so the primary conversion path stays clickable
    // while consent is still pending.
    const overlapsHorizontally =
      ctaBox!.x < bannerBox!.x + bannerBox!.width && bannerBox!.x < ctaBox!.x + ctaBox!.width;
    const overlapsVertically =
      ctaBox!.y < bannerBox!.y + bannerBox!.height && bannerBox!.y < ctaBox!.y + ctaBox!.height;
    expect(overlapsHorizontally && overlapsVertically).toBe(false);
  });

  test("blocks analytics before consent and persists the opt-in choice", async ({ page }) => {
    const analyticsRequests: string[] = [];
    await page.route(/posthog/i, (route) => {
      analyticsRequests.push(route.request().url());
      return route.fulfill({ status: 204, body: "" });
    });

    await page.goto("/");
    const banner = page.getByRole("region", { name: /preferências de cookies/i });
    await expect(banner).toBeVisible();
    expect(analyticsRequests).toHaveLength(0);

    await page.getByRole("button", { name: /aceitar todos/i }).click();
    await expect(banner).toBeHidden();

    const cookies = await page.evaluate(() => decodeURIComponent(document.cookie));
    expect(cookies).toContain("\"analytics\":true");

    // Ingestion only fires when the build carries a real key. The deploy gate
    // exports the secret to this step, so the assertion is live exactly where
    // it matters and inert on key-less local/CI builds.
    if (process.env.NUXT_PUBLIC_POSTHOG_API_KEY) {
      await expect
        .poll(() => analyticsRequests.length, { timeout: 5_000 })
        .toBeGreaterThan(0);
    }
  });
});
