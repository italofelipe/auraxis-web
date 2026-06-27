import { describe, expect, it } from "vitest";

import { dueDateForBillMonth } from "./bill-competence";

describe("dueDateForBillMonth", () => {
  it("derives a due_date that closes in the competence month (closing_day=5)", () => {
    // Unique: closing_day=5, due_day=10. A date on day 5 closes in the same month.
    const result = dueDateForBillMonth({ closing_day: 5, due_day: 10 }, "2026-05");

    expect(result).toBe("2026-05-05");
  });

  it("clamps the closing day to the last day of a short month (closing_day=30, Feb)", () => {
    const result = dueDateForBillMonth({ closing_day: 30, due_day: 7 }, "2026-02");

    expect(result).toBe("2026-02-28");
  });

  it("keeps the competence month for a late closing day (Nubank closing_day=30)", () => {
    const result = dueDateForBillMonth({ closing_day: 30, due_day: 7 }, "2026-05");

    expect(result).toBe("2026-05-30");
  });

  it("falls back to the first day of the month when the card has no cycle", () => {
    const result = dueDateForBillMonth({ closing_day: null, due_day: null }, "2026-05");

    expect(result).toBe("2026-05-01");
  });

  it("falls back to the first day of the month when no card is provided", () => {
    const result = dueDateForBillMonth(null, "2026-04");

    expect(result).toBe("2026-04-01");
  });
});
