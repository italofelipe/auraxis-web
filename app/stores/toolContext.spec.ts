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

  it("restore handles malformed JSON for result gracefully", () => {
    sessionStorage.setItem("auraxis_pending_tool_id", "some-tool");
    sessionStorage.setItem("auraxis_pending_result", "NOT_VALID_JSON");
    sessionStorage.setItem("auraxis_pending_payload", "ALSO_INVALID");

    const store = useToolContextStore();
    store.restore();

    expect(store.pendingToolId).toBe("some-tool");
    expect(store.pendingResult).toBeNull();
    expect(store.pendingPayload).toBeNull();
  });

  it("restore does nothing when sessionStorage items are null", () => {
    const store = useToolContextStore();
    store.restore();

    expect(store.pendingToolId).toBeNull();
    expect(store.pendingResult).toBeNull();
    expect(store.pendingPayload).toBeNull();
  });

  it("save stores all values in sessionStorage", () => {
    const store = useToolContextStore();
    store.save("tool-1", { value: 42 }, { input: "test" });

    expect(sessionStorage.getItem("auraxis_pending_tool_id")).toBe("tool-1");
    expect(sessionStorage.getItem("auraxis_pending_result")).toBe(JSON.stringify({ value: 42 }));
    expect(sessionStorage.getItem("auraxis_pending_payload")).toBe(JSON.stringify({ input: "test" }));
  });

  it("clear removes all items from sessionStorage", () => {
    const store = useToolContextStore();
    store.save("tool-1", { value: 42 });
    store.clear();

    expect(sessionStorage.getItem("auraxis_pending_tool_id")).toBeNull();
    expect(sessionStorage.getItem("auraxis_pending_result")).toBeNull();
    expect(sessionStorage.getItem("auraxis_pending_payload")).toBeNull();
  });
});
