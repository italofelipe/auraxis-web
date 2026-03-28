import { describe, it, expect } from "vitest";
import { usePagination } from "../usePagination";

describe("usePagination", () => {
  it("initialises with page 1, limit 20 and total 0", () => {
    const { page, limit, total } = usePagination();
    expect(page.value).toBe(1);
    expect(limit.value).toBe(20);
    expect(total.value).toBe(0);
  });

  it("respects a custom initial limit", () => {
    const { limit } = usePagination(10);
    expect(limit.value).toBe(10);
  });

  describe("totalPages", () => {
    it("returns 1 when total is 0", () => {
      const { totalPages } = usePagination();
      expect(totalPages.value).toBe(1);
    });

    it("computes pages correctly", () => {
      const { totalPages, setTotal } = usePagination(10);
      setTotal(25);
      expect(totalPages.value).toBe(3);
    });

    it("rounds up for partial last page", () => {
      const { totalPages, setTotal } = usePagination(10);
      setTotal(21);
      expect(totalPages.value).toBe(3);
    });
  });

  describe("hasPrevPage / hasNextPage", () => {
    it("hasPrevPage is false on page 1", () => {
      expect(usePagination().hasPrevPage.value).toBe(false);
    });

    it("hasNextPage is false when only one page", () => {
      const { hasNextPage } = usePagination();
      expect(hasNextPage.value).toBe(false);
    });

    it("hasNextPage is true when more pages exist", () => {
      const { hasNextPage, setTotal } = usePagination(10);
      setTotal(30);
      expect(hasNextPage.value).toBe(true);
    });

    it("hasPrevPage is true after moving past page 1", () => {
      const { hasPrevPage, setTotal, nextPage } = usePagination(10);
      setTotal(30);
      nextPage();
      expect(hasPrevPage.value).toBe(true);
    });
  });

  describe("nextPage", () => {
    it("advances the page when next page exists", () => {
      const { page, setTotal, nextPage } = usePagination(10);
      setTotal(30);
      nextPage();
      expect(page.value).toBe(2);
    });

    it("does not advance past the last page", () => {
      const { page, setTotal, nextPage } = usePagination(10);
      setTotal(10);
      nextPage();
      expect(page.value).toBe(1);
    });
  });

  describe("prevPage", () => {
    it("decrements the page when prev page exists", () => {
      const { page, setTotal, nextPage, prevPage } = usePagination(10);
      setTotal(30);
      nextPage();
      prevPage();
      expect(page.value).toBe(1);
    });

    it("does not go below page 1", () => {
      const { page, prevPage } = usePagination();
      prevPage();
      expect(page.value).toBe(1);
    });
  });

  describe("goToPage", () => {
    it("jumps to a specific page", () => {
      const { page, setTotal, goToPage } = usePagination(10);
      setTotal(50);
      goToPage(3);
      expect(page.value).toBe(3);
    });

    it("clamps to 1 when given 0 or negative", () => {
      const { page, goToPage } = usePagination(10);
      goToPage(0);
      expect(page.value).toBe(1);
    });

    it("clamps to totalPages when given a value that is too high", () => {
      const { page, setTotal, goToPage } = usePagination(10);
      setTotal(20);
      goToPage(999);
      expect(page.value).toBe(2);
    });
  });

  describe("setTotal", () => {
    it("updates total correctly", () => {
      const { total, setTotal } = usePagination();
      setTotal(100);
      expect(total.value).toBe(100);
    });
  });

  describe("reset", () => {
    it("resets page to 1 and total to 0", () => {
      const { page, total, setTotal, nextPage, reset } = usePagination(10);
      setTotal(50);
      nextPage();
      reset();
      expect(page.value).toBe(1);
      expect(total.value).toBe(0);
    });
  });
});
