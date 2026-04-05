import { describe, expect, it } from "vitest";

import { MOCK_ALL_PLANS, MOCK_CURRENT_SUBSCRIPTION } from "./subscription.mock";
import { PRICING } from "~/shared/constants/pricing";

/**
 * Contract tests for the canonical mock data.
 *
 * These tests act as a guardrail against accidental price or slug drift.
 * The canonical pricing (2026):
 *   Free:    R$0
 *   Premium: R$27,90/mês ou R$220,00/ano (R$18,33/mês equivalente — ~34% savings)
 */
describe("subscription mock data", () => {
  describe("MOCK_ALL_PLANS", () => {
    it("contains exactly two plans: free and premium", () => {
      const slugs = MOCK_ALL_PLANS.map((p) => p.slug);
      expect(slugs).toEqual(["free", "premium"]);
    });

    it("free plan has zero price", () => {
      const free = MOCK_ALL_PLANS.find((p) => p.slug === "free")!;
      expect(free.price_monthly).toBe(0);
      expect(free.price_annual).toBe(0);
    });

    it("premium plan has canonical monthly price of R$27.90", () => {
      const premium = MOCK_ALL_PLANS.find((p) => p.slug === "premium")!;
      expect(premium.price_monthly).toBe(PRICING.MONTHLY_PRICE);
    });

    it("premium plan annual per-month equivalent is R$18.33 (annual total R$220.00)", () => {
      const premium = MOCK_ALL_PLANS.find((p) => p.slug === "premium")!;
      expect(premium.price_annual).toBe(PRICING.ANNUAL_MONTHLY_EQUIVALENT);
    });

    it("premium annual is cheaper than monthly (discount applies)", () => {
      const premium = MOCK_ALL_PLANS.find((p) => p.slug === "premium")!;
      expect(premium.price_annual).toBeLessThan(premium.price_monthly);
    });

    it("annual discount is approximately 34%", () => {
      const premium = MOCK_ALL_PLANS.find((p) => p.slug === "premium")!;
      const discount = Math.round(
        ((premium.price_monthly * 12 - PRICING.ANNUAL_PRICE) / (premium.price_monthly * 12)) * 100,
      );
      expect(discount).toBe(PRICING.ANNUAL_SAVINGS_PERCENT);
    });
  });

  describe("MOCK_CURRENT_SUBSCRIPTION", () => {
    it("uses the premium slug", () => {
      expect(MOCK_CURRENT_SUBSCRIPTION.plan.slug).toBe("premium");
    });

    it("has an active status", () => {
      expect(MOCK_CURRENT_SUBSCRIPTION.status).toBe("active");
    });

    it("is not scheduled for cancellation", () => {
      expect(MOCK_CURRENT_SUBSCRIPTION.cancel_at_period_end).toBe(false);
    });

    it("has a future current_period_end date", () => {
      const end = new Date(MOCK_CURRENT_SUBSCRIPTION.current_period_end!);
      expect(end.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
