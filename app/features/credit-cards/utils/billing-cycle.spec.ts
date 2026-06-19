import { describe, expect, it } from "vitest";

import { resolveCreditCardBillingCycle } from "./billing-cycle";

describe("resolveCreditCardBillingCycle", () => {
  it("keeps purchases before closing in the current bill month", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-04",
      closingDay: 5,
      dueDay: 10,
    });

    expect(cycle.billMonth).toBe("2026-06");
    expect(cycle.billLabel).toBe("junho de 2026");
    expect(cycle.cycleStartDate).toBe("2026-05-06");
    expect(cycle.closingDate).toBe("2026-06-05");
    expect(cycle.dueDate).toBe("2026-06-10");
  });

  it("moves purchases after closing to the next bill month", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-06-06",
      closingDay: 5,
      dueDay: 10,
    });

    expect(cycle.billMonth).toBe("2026-07");
    expect(cycle.billLabel).toBe("julho de 2026");
    expect(cycle.cycleStartDate).toBe("2026-06-06");
    expect(cycle.closingDate).toBe("2026-07-05");
    expect(cycle.dueDate).toBe("2026-07-10");
  });

  it("moves due date to the month after closing when due day is before closing day", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-12-20",
      closingDay: 25,
      dueDay: 5,
    });

    expect(cycle.billMonth).toBe("2026-12");
    expect(cycle.closingDate).toBe("2026-12-25");
    expect(cycle.dueDate).toBe("2027-01-05");
  });

  it("clamps closing and due days for short months", () => {
    const cycle = resolveCreditCardBillingCycle({
      purchaseDate: "2026-02-20",
      closingDay: 31,
      dueDay: 31,
    });

    expect(cycle.closingDate).toBe("2026-02-28");
    expect(cycle.dueDate).toBe("2026-03-31");
  });
});
