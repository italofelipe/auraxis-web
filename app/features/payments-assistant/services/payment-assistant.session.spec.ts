import { beforeEach, describe, expect, it } from "vitest";

import {
  ASSISTANT_SESSION_KEY,
  markAssistantShown,
  shouldAutoOpenAssistant,
  wasAssistantShown,
} from "./payment-assistant.session";

/**
 * Builds a minimal in-memory Storage stub for deterministic session tests.
 *
 * @returns A Storage-compatible stub backed by a Map.
 */
const makeStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
};

describe("shouldAutoOpenAssistant", () => {
  const base = {
    flagEnabled: true,
    isPremium: true,
    shownThisSession: false,
    candidateCount: 3,
    heldByOtherModals: false,
  };

  it("opens when all conditions are met", () => {
    expect(shouldAutoOpenAssistant(base)).toBe(true);
  });

  it("stays closed when the feature flag is off", () => {
    expect(shouldAutoOpenAssistant({ ...base, flagEnabled: false })).toBe(false);
  });

  it("stays closed for non-Premium users", () => {
    expect(shouldAutoOpenAssistant({ ...base, isPremium: false })).toBe(false);
  });

  it("stays closed when already shown this session", () => {
    expect(shouldAutoOpenAssistant({ ...base, shownThisSession: true })).toBe(false);
  });

  it("stays closed when other modals hold the surface", () => {
    expect(shouldAutoOpenAssistant({ ...base, heldByOtherModals: true })).toBe(false);
  });

  it("stays closed when there are no candidates", () => {
    expect(shouldAutoOpenAssistant({ ...base, candidateCount: 0 })).toBe(false);
  });
});

describe("session-shown flag", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = makeStorage();
  });

  it("reports not shown before being marked", () => {
    expect(wasAssistantShown(storage)).toBe(false);
  });

  it("persists the shown flag under the session key", () => {
    markAssistantShown(storage);
    expect(storage.getItem(ASSISTANT_SESSION_KEY)).toBe("1");
    expect(wasAssistantShown(storage)).toBe(true);
  });
});
