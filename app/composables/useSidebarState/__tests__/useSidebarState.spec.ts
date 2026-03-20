import { describe, it, expect, beforeEach, vi } from "vitest";

const STORAGE_KEY = "auraxis:sidebar:collapsed";

// Mock localStorage before the module is loaded
let store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value; },
  removeItem: (key: string): void => { store = Object.fromEntries(Object.entries(store).filter(([k]) => k !== key)); },
  clear: (): void => { store = {}; },
};

vi.stubGlobal("localStorage", localStorageMock);

describe("useSidebarState", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.resetModules();
  });

  it("starts expanded by default", async () => {
    const { useSidebarState } = await import("../useSidebarState");
    const { isCollapsed } = useSidebarState();
    expect(isCollapsed.value).toBe(false);
  });

  it("toggle changes state", async () => {
    const { useSidebarState } = await import("../useSidebarState");
    const { isCollapsed, toggle } = useSidebarState();
    const initial = isCollapsed.value;
    toggle();
    expect(isCollapsed.value).toBe(!initial);
  });

  it("collapse sets isCollapsed to true", async () => {
    const { useSidebarState } = await import("../useSidebarState");
    const { isCollapsed, collapse } = useSidebarState();
    collapse();
    expect(isCollapsed.value).toBe(true);
  });

  it("expand sets isCollapsed to false", async () => {
    const { useSidebarState } = await import("../useSidebarState");
    const { isCollapsed, expand } = useSidebarState();
    expand();
    expect(isCollapsed.value).toBe(false);
  });

  it("persists state in localStorage", async () => {
    const { useSidebarState } = await import("../useSidebarState");
    const { collapse } = useSidebarState();
    collapse();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });
});
