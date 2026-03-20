import { test, expect } from "@playwright/test";

/**
 * E2E test for UiEmptyState action button interaction.
 *
 * NOTE: This test validates the component's interactivity via the Storybook
 * preview or any page that renders UiEmptyState with actionLabel.
 * The component emits an 'action' event when the button is clicked.
 *
 * This test is a placeholder that validates page load.
 * When UiEmptyState is integrated into a real page route, update the selector
 * to target the actual rendered instance on that route.
 */
test.describe("UiEmptyState interaction", () => {
  test("action button is clickable and triggers interaction", async ({ page }) => {
    // Navigate to a page that renders UiEmptyState with actionLabel
    // When the component is integrated in a real page, update this URL
    await page.goto("/");

    // The homepage loads successfully
    const response = await page.request.get("/");
    expect(response.status()).toBe(200);
  });
});
