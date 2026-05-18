import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Cookie consent", () => {
  test("blocks analytics requests before consent and saves granular choices", async ({ page }) => {
    const analyticsRequests: string[] = [];

    await page.route(/posthog/i, (route) => {
      analyticsRequests.push(route.request().url());
      return route.fulfill({ status: 204, body: "" });
    });

    await page.goto("/");

    const banner = page.getByRole("region", { name: /preferências de cookies/i });
    await expect(banner).toBeVisible();
    expect(analyticsRequests).toHaveLength(0);

    await page.getByRole("button", { name: /configurar/i }).click();
    await page.getByLabel(/analytics e performance/i).uncheck();
    await page.getByLabel(/marketing/i).check();
    await page.getByRole("button", { name: /salvar preferências/i }).click();

    await expect(banner).toBeHidden();

    const cookies = await page.evaluate(() => decodeURIComponent(document.cookie));
    expect(cookies).toContain("\"analytics\":false");
    expect(cookies).toContain("\"marketing\":true");
  });
});
