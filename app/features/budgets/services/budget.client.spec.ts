import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosInstance } from "axios";

import { BudgetClient } from "./budget.client";
import type { BudgetDto, BudgetSummaryDto } from "~/features/budgets/contracts/budget.contracts";

/**
 * Creates a minimal valid BudgetDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete BudgetDto fixture.
 */
const makeBudgetDto = (overrides: Partial<BudgetDto> = {}): BudgetDto => ({
  id: "budget-001",
  name: "Alimentação Mensal",
  amount: "800.00",
  spent: "450.00",
  remaining: "350.00",
  percentage_used: 56.25,
  period: "monthly",
  start_date: null,
  end_date: null,
  tag_id: null,
  tag_name: null,
  tag_color: null,
  is_active: true,
  is_over_budget: false,
  created_at: "2026-04-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
  ...overrides,
});

describe("BudgetClient", () => {
  let http: AxiosInstance;
  let client: BudgetClient;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as AxiosInstance;
    client = new BudgetClient(http);
  });

  describe("listBudgets", () => {
    it("returns items array from wrapped response", async () => {
      const budgets = [makeBudgetDto()];
      vi.mocked(http.get).mockResolvedValueOnce({ data: { items: budgets } });

      const result = await client.listBudgets();

      expect(http.get).toHaveBeenCalledWith("/budgets");
      expect(result).toEqual(budgets);
    });

    it("returns data directly if API returns an array", async () => {
      const budgets = [makeBudgetDto()];
      vi.mocked(http.get).mockResolvedValueOnce({ data: budgets });

      const result = await client.listBudgets();

      expect(result).toEqual(budgets);
    });

    it("returns empty array when items is empty", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: { items: [] } });

      const result = await client.listBudgets();

      expect(result).toEqual([]);
    });
  });

  describe("createBudget", () => {
    it("calls POST /budgets and returns the created budget", async () => {
      const budget = makeBudgetDto();
      vi.mocked(http.post).mockResolvedValueOnce({ data: budget });

      const result = await client.createBudget({
        name: "Alimentação Mensal",
        amount: "800.00",
      });

      expect(http.post).toHaveBeenCalledWith("/budgets", {
        name: "Alimentação Mensal",
        amount: "800.00",
      });
      expect(result).toEqual(budget);
    });
  });

  describe("updateBudget", () => {
    it("calls PATCH /budgets/:id and returns updated budget", async () => {
      const budget = makeBudgetDto({ name: "Alimentação Atualizada" });
      vi.mocked(http.patch).mockResolvedValueOnce({ data: budget });

      const result = await client.updateBudget("budget-001", { name: "Alimentação Atualizada" });

      expect(http.patch).toHaveBeenCalledWith("/budgets/budget-001", {
        name: "Alimentação Atualizada",
      });
      expect(result).toEqual(budget);
    });
  });

  describe("deleteBudget", () => {
    it("calls DELETE /budgets/:id", async () => {
      vi.mocked(http.delete).mockResolvedValueOnce({ data: undefined });

      await client.deleteBudget("budget-001");

      expect(http.delete).toHaveBeenCalledWith("/budgets/budget-001");
    });
  });

  describe("getSummary", () => {
    it("calls GET /budgets/summary and returns BudgetSummaryDto", async () => {
      const summary: BudgetSummaryDto = {
        total_budgeted: "1200.00",
        total_spent: "800.00",
        total_remaining: "400.00",
        percentage_used: 66.67,
        budget_count: 2,
      };
      vi.mocked(http.get).mockResolvedValueOnce({ data: summary });

      const result = await client.getSummary();

      expect(http.get).toHaveBeenCalledWith("/budgets/summary");
      expect(result).toEqual(summary);
    });
  });
});
