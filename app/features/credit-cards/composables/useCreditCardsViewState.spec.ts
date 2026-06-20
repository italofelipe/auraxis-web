import { describe, expect, it } from "vitest";

import { currentMonthKey, useCreditCardsViewState } from "./useCreditCardsViewState";

describe("currentMonthKey", () => {
  it("formats the reference date as YYYY-MM", () => {
    expect(currentMonthKey(new Date(2026, 5, 19))).toBe("2026-06");
    expect(currentMonthKey(new Date(2026, 0, 1))).toBe("2026-01");
  });
});

describe("useCreditCardsViewState", () => {
  it("starts with sensible defaults", () => {
    const state = useCreditCardsViewState({ initialMonth: "2026-06" });
    expect(state.view.value).toBe("faturas");
    expect(state.month.value).toBe("2026-06");
    expect(state.selectedCardId.value).toBeNull();
    expect(state.monthLabel.value).toBe("junho de 2026");
  });

  it("honours initial overrides", () => {
    const state = useCreditCardsViewState({
      initialView: "analitico",
      initialMonth: "2026-03",
      initialCardId: "cc-1",
    });
    expect(state.view.value).toBe("analitico");
    expect(state.selectedCardId.value).toBe("cc-1");
  });

  it("shifts the month and keeps the label in sync", () => {
    const state = useCreditCardsViewState({ initialMonth: "2026-01" });
    state.shiftMonth(-1);
    expect(state.month.value).toBe("2025-12");
    expect(state.monthLabel.value).toBe("dezembro de 2025");
    state.shiftMonth(2);
    expect(state.month.value).toBe("2026-02");
  });

  it("updates view, month and selected card via actions", () => {
    const state = useCreditCardsViewState({ initialMonth: "2026-06" });
    state.setView("analitico");
    state.setMonth("2026-05");
    state.selectCard("cc-2");
    expect(state.view.value).toBe("analitico");
    expect(state.month.value).toBe("2026-05");
    expect(state.selectedCardId.value).toBe("cc-2");
    state.selectCard(null);
    expect(state.selectedCardId.value).toBeNull();
  });
});
