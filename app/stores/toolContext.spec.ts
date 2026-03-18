import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useToolContextStore } from "./toolContext";

describe("toolContext store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
  });

  it("salva tool id e resultado no estado e no sessionStorage", () => {
    const store = useToolContextStore();
    const result = { score: 42 };

    store.save("raise-calculator", result);

    expect(store.pendingToolId).toBe("raise-calculator");
    expect(store.pendingResult).toEqual(result);
    expect(sessionStorage.getItem("auraxis_pending_tool_id")).toBe("raise-calculator");
    expect(JSON.parse(sessionStorage.getItem("auraxis_pending_result") ?? "null")).toEqual(result);
  });

  it("restaura contexto a partir do sessionStorage", () => {
    sessionStorage.setItem("auraxis_pending_tool_id", "bill-forecast");
    sessionStorage.setItem("auraxis_pending_result", JSON.stringify({ balance: 100 }));

    const store = useToolContextStore();
    store.restore();

    expect(store.pendingToolId).toBe("bill-forecast");
    expect(store.pendingResult).toEqual({ balance: 100 });
  });

  it("clear remove dados do estado e do sessionStorage", () => {
    const store = useToolContextStore();
    store.save("raise-calculator", { score: 1 });

    store.clear();

    expect(store.pendingToolId).toBeNull();
    expect(store.pendingResult).toBeNull();
    expect(sessionStorage.getItem("auraxis_pending_tool_id")).toBeNull();
    expect(sessionStorage.getItem("auraxis_pending_result")).toBeNull();
  });
});
