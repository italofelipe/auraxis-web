import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useToolContextStore } from "./toolContext";

describe("toolContext store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
  });

  it("persists and restores payload together with result", () => {
    const store = useToolContextStore();

    store.save("installment_vs_cash", { result: true }, { form: { foo: "bar" } });

    const restoredStore = useToolContextStore();
    restoredStore.restore();

    expect(restoredStore.pendingToolId).toBe("installment_vs_cash");
    expect(restoredStore.pendingResult).toEqual({ result: true });
    expect(restoredStore.pendingPayload).toEqual({ form: { foo: "bar" } });
  });

  it("clears all persisted state", () => {
    const store = useToolContextStore();

    store.save("installment_vs_cash", { result: true }, { form: { foo: "bar" } });
    store.clear();

    expect(store.pendingToolId).toBeNull();
    expect(store.pendingResult).toBeNull();
    expect(store.pendingPayload).toBeNull();
  });
});
