import { computed } from "vue";
import { describe, expect, it } from "vitest";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { darkenHex, formatTransactionDate, isTransactionNearDue, isTransactionOverdue, renderTagBadge } from "../useTransactionTable";
import type { TagLookup } from "../useTransactionFilters";

describe("formatTransactionDate", () => {
  it("formats YYYY-MM-DD as dd/MM/yyyy", () => {
    expect(formatTransactionDate("2026-03-07")).toBe("07/03/2026");
  });

  it("pads single-digit day and month", () => {
    expect(formatTransactionDate("2026-01-05")).toBe("05/01/2026");
  });
});

describe("isTransactionOverdue", () => {
  it("returns false for paid transactions regardless of due date", () => {
    expect(isTransactionOverdue("2020-01-01", "paid")).toBe(false);
  });

  it("returns true for past due date with pending status", () => {
    expect(isTransactionOverdue("2020-01-01", "pending")).toBe(true);
  });

  it("returns false for future due date with pending status", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const isoDate = future.toISOString().slice(0, 10);
    expect(isTransactionOverdue(isoDate, "pending")).toBe(false);
  });
});

describe("isTransactionNearDue", () => {
  it("returns false for paid transactions", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isTransactionNearDue(tomorrow.toISOString().slice(0, 10), "paid")).toBe(false);
  });

  it("returns true for unpaid transaction due within 7 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    expect(isTransactionNearDue(soon.toISOString().slice(0, 10), "pending")).toBe(true);
  });

  it("returns false for unpaid transaction due in 8+ days", () => {
    const far = new Date();
    far.setDate(far.getDate() + 10);
    expect(isTransactionNearDue(far.toISOString().slice(0, 10), "pending")).toBe(false);
  });

  it("returns false for overdue (past) transactions", () => {
    expect(isTransactionNearDue("2020-01-01", "pending")).toBe(false);
  });
});

describe("darkenHex", () => {
  it("returns pure black when factor is 1", () => {
    expect(darkenHex("#FF6B6B", 1)).toBe("#000000");
  });

  it("returns original colour when factor is 0", () => {
    expect(darkenHex("#ff6b6b", 0)).toBe("#ff6b6b");
  });

  it("darkens each channel by the factor (mix with black)", () => {
    // 0xFF (255) * (1 - 0.5) = 127.5 → rounds to 128 → 0x80
    expect(darkenHex("#FF6B6B", 0.5)).toBe("#803636");
  });

  it("pads single-hex-digit channels to two characters", () => {
    // 0x11 * 0.5 = 8.5 → rounds to 9 → must be "09", not "9"
    expect(darkenHex("#111111", 0.5)).toBe("#090909");
  });
});

describe("renderTagBadge", () => {
  /**
   * Builds a minimal transaction fixture for tag-badge tests.
   *
   * @param tagId - Optional tag id to assign to the row.
   * @returns A TransactionDto with the given tag id.
   */
  function buildTx(tagId: string | null): TransactionDto {
    return {
      id: "tx-1",
      title: "Payment",
      amount: "10.00",
      type: "expense",
      status: "pending",
      due_date: "2026-01-01",
      tag_id: tagId,
    } as unknown as TransactionDto;
  }

  it("returns em-dash placeholder when tag is not in the map", () => {
    const map = computed(() => new Map<string, TagLookup>());
    expect(renderTagBadge(buildTx(null), map)).toBe("—");
  });

  it("returns plain tag name when tag exists but has no colour", () => {
    const map = computed(() => new Map<string, TagLookup>([["t1", { name: "Food", color: null }]]));
    expect(renderTagBadge(buildTx("t1"), map)).toBe("Food");
  });

  it("returns a styled VNode when tag has a colour", () => {
    const map = computed(() => new Map<string, TagLookup>([["t1", { name: "Urgent", color: "#FF6B6B" }]]));
    const result = renderTagBadge(buildTx("t1"), map);
    expect(typeof result).toBe("object");
    // VNode children contain the tag name
    expect(JSON.stringify(result)).toContain("Urgent");
    // Style string includes the background colour + 20 alpha suffix
    expect(JSON.stringify(result)).toContain("#FF6B6B20");
  });
});
