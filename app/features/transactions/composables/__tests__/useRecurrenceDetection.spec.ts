import { describe, it, expect } from "vitest";
import { computed } from "vue";
import {
  detectRecurrencePatterns,
  useRecurrenceDetection,
} from "../useRecurrenceDetection";
import type { TransactionDto } from "../../contracts/transaction.dto";

// ── Factories ─────────────────────────────────────────────────────────────────

const BASE: TransactionDto = {
  id: "0",
  title: "Netflix",
  amount: "39.90",
  type: "expense",
  due_date: "2025-01-15",
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  currency: "BRL",
  status: "paid",
  start_date: null,
  end_date: null,
  tag_id: "tag-streaming",
  account_id: null,
  credit_card_id: null,
  installment_group_id: null,
  paid_at: null,
  created_at: null,
  updated_at: null,
};

/**
 * Builds a monthly series of transactions starting at startYearMonth
 * (format "YYYY-MM") for `count` months.
 *
 * @param overrides - Fields to merge into BASE.
 * @param startYearMonth - Start month string.
 * @param count - Number of months.
 * @returns Array of TransactionDto.
 */
function makeMonthly(
  overrides: Partial<TransactionDto>,
  startYearMonth: string,
  count: number,
): TransactionDto[] {
  const [y, m] = startYearMonth.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC((y ?? 2025), ((m ?? 1) - 1) + i, 15));
    return {
      ...BASE,
      ...overrides,
      id: `${overrides.id ?? "tx"}-${i}`,
      due_date: date.toISOString().slice(0, 10),
    };
  });
}

// ── detectRecurrencePatterns ─────────────────────────────────────────────────

describe("detectRecurrencePatterns", () => {
  it("returns empty array when there are no transactions", () => {
    expect(detectRecurrencePatterns([])).toEqual([]);
  });

  it("detects a high-confidence pattern with 6+ monthly occurrences", () => {
    const txs = makeMonthly({}, "2025-01", 7);
    const patterns = detectRecurrencePatterns(txs);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.confidence).toBe("high");
    expect(patterns[0]?.label).toBe("Netflix");
    expect(patterns[0]?.medianAmount).toBeCloseTo(39.9);
    expect(patterns[0]?.annualImpact).toBeCloseTo(39.9 * 12);
  });

  it("detects a medium-confidence pattern with 4 monthly occurrences", () => {
    const txs = makeMonthly({}, "2025-01", 4);
    const patterns = detectRecurrencePatterns(txs);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.confidence).toBe("medium");
  });

  it("detects a low-confidence pattern with exactly 3 occurrences", () => {
    const txs = makeMonthly({}, "2025-01", 3);
    const patterns = detectRecurrencePatterns(txs);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.confidence).toBe("low");
  });

  it("does not detect a pattern with only 2 occurrences", () => {
    const txs = makeMonthly({}, "2025-01", 2);
    expect(detectRecurrencePatterns(txs)).toHaveLength(0);
  });

  it("ignores transactions already marked as recurring", () => {
    const txs = makeMonthly({ is_recurring: true }, "2025-01", 6);
    expect(detectRecurrencePatterns(txs)).toHaveLength(0);
  });

  it("ignores installment transactions", () => {
    const txs = makeMonthly({ is_installment: true }, "2025-01", 6);
    expect(detectRecurrencePatterns(txs)).toHaveLength(0);
  });

  it("tolerates ±5% amount variation and still detects the pattern", () => {
    const amounts = ["39.90", "40.50", "38.70", "41.00", "39.20", "40.10"];
    const [y, m] = "2025-01".split("-").map(Number);
    const txs: TransactionDto[] = amounts.map((amount, i) => {
      const date = new Date(Date.UTC((y ?? 2025), ((m ?? 1) - 1) + i, 15));
      return {
        ...BASE,
        id: `var-${i}`,
        amount,
        due_date: date.toISOString().slice(0, 10),
      };
    });

    const patterns = detectRecurrencePatterns(txs);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.confidence).toBeOneOf(["high", "medium", "low"]);
  });

  it("rejects amounts that vary more than 5%", () => {
    // First 3 months normal, next 3 months completely different amount.
    const normal = makeMonthly({ id: "n" }, "2025-01", 3);
    const outliers = makeMonthly({ id: "o", amount: "200.00" }, "2025-04", 3);
    const txs = [...normal, ...outliers];

    // Both groups share the same tag_id → one group with 6 items but amounts diverge.
    // Algorithm should reject because median band won't include outliers.
    const patterns = detectRecurrencePatterns(txs);
    // May produce 0 or 1 patterns depending on median; either way it won't
    // include all 6, so confidence must be at most medium (≥3 matching months).
    if (patterns.length > 0) {
      expect(patterns[0]?.transactionIds.length).toBeLessThanOrEqual(4);
    }
  });

  it("groups by title when tag_id is null", () => {
    const txs = makeMonthly({ tag_id: null }, "2025-01", 5);
    const patterns = detectRecurrencePatterns(txs);

    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.groupKey).toMatch(/^title:/);
  });

  it("separates patterns from different tag_ids", () => {
    const netflix = makeMonthly({ id: "nf", tag_id: "tag-streaming" }, "2025-01", 4);
    const spotify = makeMonthly(
      { id: "sp", tag_id: "tag-music", title: "Spotify", amount: "21.90" },
      "2025-01",
      4,
    );

    const patterns = detectRecurrencePatterns([...netflix, ...spotify]);
    expect(patterns).toHaveLength(2);
  });

  it("sorts patterns: high confidence before medium", () => {
    const highConf = makeMonthly({ id: "h", tag_id: "t1" }, "2024-07", 7); // 7 months
    const medConf = makeMonthly({ id: "m", tag_id: "t2", title: "Gym", amount: "100.00" }, "2025-01", 4);

    const patterns = detectRecurrencePatterns([...medConf, ...highConf]);
    expect(patterns[0]?.confidence).toBe("high");
    expect(patterns[1]?.confidence).toBe("medium");
  });

  it("rejects groups where gap is not monthly (e.g., weekly)", () => {
    // Weekly transactions (gap ~7 days) — should not match 28–35d window.
    const [y, m] = "2025-01".split("-").map(Number);
    const txs: TransactionDto[] = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC((y ?? 2025), ((m ?? 1) - 1), 1 + i * 7));
      return {
        ...BASE,
        id: `weekly-${i}`,
        due_date: date.toISOString().slice(0, 10),
      };
    });

    // Multiple calendar months covered, but gap is weekly → should not detect monthly.
    const patterns = detectRecurrencePatterns(txs);
    expect(patterns).toHaveLength(0);
  });

  it("calculates annualImpact as medianAmount × 12", () => {
    const txs = makeMonthly({}, "2025-01", 6);
    const [pattern] = detectRecurrencePatterns(txs);
    expect(pattern?.annualImpact).toBeCloseTo((pattern?.medianAmount ?? 0) * 12);
  });
});

// ── useRecurrenceDetection composable ────────────────────────────────────────

describe("useRecurrenceDetection", () => {
  it("returns a computed ref that reflects current transaction data", () => {
    const txs = computed(() => makeMonthly({}, "2025-01", 6));
    const { patterns } = useRecurrenceDetection(txs);

    expect(patterns.value).toHaveLength(1);
    expect(patterns.value[0]?.confidence).toBe("high");
  });

  it("returns empty patterns when transactions list is empty", () => {
    const txs = computed(() => [] as TransactionDto[]);
    const { patterns } = useRecurrenceDetection(txs);

    expect(patterns.value).toHaveLength(0);
  });
});
