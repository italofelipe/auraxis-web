import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUiStore } from "./ui";

describe("useUiStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("has correct initial state", () => {
    const store = useUiStore();
    expect(store.isPageLoading).toBe(false);
    expect(store.isMobileMenuOpen).toBe(false);
  });

  describe("setPageLoading", () => {
    it("sets isPageLoading to true", () => {
      const store = useUiStore();
      store.setPageLoading(true);
      expect(store.isPageLoading).toBe(true);
    });

    it("sets isPageLoading to false", () => {
      const store = useUiStore();
      store.setPageLoading(true);
      store.setPageLoading(false);
      expect(store.isPageLoading).toBe(false);
    });
  });

  describe("openMobileMenu", () => {
    it("sets isMobileMenuOpen to true", () => {
      const store = useUiStore();
      store.openMobileMenu();
      expect(store.isMobileMenuOpen).toBe(true);
    });
  });

  describe("closeMobileMenu", () => {
    it("sets isMobileMenuOpen to false", () => {
      const store = useUiStore();
      store.openMobileMenu();
      store.closeMobileMenu();
      expect(store.isMobileMenuOpen).toBe(false);
    });
  });

  describe("toggleMobileMenu", () => {
    it("opens when closed", () => {
      const store = useUiStore();
      store.toggleMobileMenu();
      expect(store.isMobileMenuOpen).toBe(true);
    });

    it("closes when open", () => {
      const store = useUiStore();
      store.openMobileMenu();
      store.toggleMobileMenu();
      expect(store.isMobileMenuOpen).toBe(false);
    });

    it("toggles repeatedly", () => {
      const store = useUiStore();
      store.toggleMobileMenu(); // open
      store.toggleMobileMenu(); // close
      store.toggleMobileMenu(); // open
      expect(store.isMobileMenuOpen).toBe(true);
    });
  });
});
