import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
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

describe("useResponsiveShell — mobile viewport", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    vi.restoreAllMocks();
  });

  it("detects mobile viewport on mount when innerWidth < 768", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });

    let result: ReturnType<typeof useResponsiveShell> | undefined;

    const TestComponent = defineComponent({
      setup() {
        result = useResponsiveShell();
        return {};
      },
      template: "<div />",
    });

    mount(TestComponent);

    expect(result?.isMobile.value).toBe(true);
  });

  it("sets isMobile false and closes drawer when viewport >= 768 on mount", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    let result: ReturnType<typeof useResponsiveShell> | undefined;

    const TestComponent = defineComponent({
      setup() {
        result = useResponsiveShell();
        result.openDrawer();
        return {};
      },
      template: "<div />",
    });

    mount(TestComponent);

    expect(result?.isMobile.value).toBe(false);
    expect(result?.isDrawerOpen.value).toBe(false);
  });

  it("registers resize listener on mount and removes on unmount", async () => {
    const TestComponent = defineComponent({
      setup() {
        useResponsiveShell();
        return {};
      },
      template: "<div />",
    });

    const wrapper = mount(TestComponent);

    expect(window.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

    wrapper.unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
  });
});
