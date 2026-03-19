import { describe, it, expect } from "vitest";
import { useResponsiveShell } from "../useResponsiveShell";

describe("useResponsiveShell", () => {
  it("isMobile is initially false (jsdom default)", () => {
    const { isMobile } = useResponsiveShell();
    expect(isMobile.value).toBe(false);
  });

  it("openDrawer sets isDrawerOpen to true", () => {
    const { isDrawerOpen, openDrawer } = useResponsiveShell();
    openDrawer();
    expect(isDrawerOpen.value).toBe(true);
  });

  it("closeDrawer sets isDrawerOpen to false", () => {
    const { isDrawerOpen, openDrawer, closeDrawer } = useResponsiveShell();
    openDrawer();
    closeDrawer();
    expect(isDrawerOpen.value).toBe(false);
  });

  it("toggleDrawer changes isDrawerOpen", () => {
    const { isDrawerOpen, toggleDrawer } = useResponsiveShell();
    expect(isDrawerOpen.value).toBe(false);
    toggleDrawer();
    expect(isDrawerOpen.value).toBe(true);
    toggleDrawer();
    expect(isDrawerOpen.value).toBe(false);
  });

  it("isDrawerOpen closes when closeDrawer is called", () => {
    const { isDrawerOpen, openDrawer, closeDrawer } = useResponsiveShell();
    openDrawer();
    expect(isDrawerOpen.value).toBe(true);
    closeDrawer();
    expect(isDrawerOpen.value).toBe(false);
  });
});
