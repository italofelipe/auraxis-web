/**
 * Unit tests for useTheme composable.
 *
 * useState (Nuxt) is guarded with a try/catch inside useTheme: when called
 * outside a Nuxt context (Vitest / happy-dom) it falls back to a plain ref so
 * the composable's reactive and localStorage logic can be tested in isolation.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { useTheme } from "../useTheme";

/**
 * Stubs the system color scheme media query used by the theme composable.
 * @param matchesDark Whether the mocked system theme should resolve as dark.
 */
function mockSystemTheme(matchesDark: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? matchesDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    mockSystemTheme(false);
  });

  it("defaults to light mode when localStorage is empty", () => {
    const { isDark, themePreference, resolvedTheme } = useTheme();
    expect(themePreference.value).toBe("light");
    expect(resolvedTheme.value).toBe("light");
    expect(isDark.value).toBe(false);
  });

  it("reads 'light' from localStorage after mount and switches to light", async (): Promise<void> => {
    localStorage.setItem("auraxis-theme", "light");

    let result: ReturnType<typeof useTheme> | undefined;

    const TestComponent = defineComponent({
      setup() {
        result = useTheme();
        return {};
      },
      template: "<div />",
    });

    mount(TestComponent);
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(result?.isDark.value).toBe(false);
  });

  it("keeps dark mode when localStorage value is 'dark'", async (): Promise<void> => {
    localStorage.setItem("auraxis-theme", "dark");

    let result: ReturnType<typeof useTheme> | undefined;

    const TestComponent = defineComponent({
      setup() {
        result = useTheme();
        return {};
      },
      template: "<div />",
    });

    mount(TestComponent);
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(result?.isDark.value).toBe(true);
  });

  it("reads 'system' from localStorage and resolves the system color scheme", async (): Promise<void> => {
    localStorage.setItem("auraxis-theme", "system");
    mockSystemTheme(true);

    let result: ReturnType<typeof useTheme> | undefined;

    const TestComponent = defineComponent({
      setup() {
        result = useTheme();
        return {};
      },
      template: "<div />",
    });

    mount(TestComponent);
    await new Promise<void>((r) => setTimeout(r, 0));

    expect(result?.themePreference.value).toBe("system");
    expect(result?.resolvedTheme.value).toBe("dark");
    expect(result?.isDark.value).toBe(true);
  });

  it("setPreference persists an explicit dark preference", (): void => {
    const { setPreference, themePreference, isDark } = useTheme();

    setPreference("dark");

    expect(themePreference.value).toBe("dark");
    expect(isDark.value).toBe(true);
    expect(localStorage.getItem("auraxis-theme")).toBe("dark");
  });

  it("applies the resolved theme to the document root", async (): Promise<void> => {
    const { setPreference } = useTheme();

    await nextTick();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement.style.colorScheme).toBe("light");

    setPreference("dark");
    await nextTick();

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("toggle switches from light to dark", (): void => {
    const { isDark, toggle } = useTheme();

    expect(isDark.value).toBe(false);
    toggle();
    expect(isDark.value).toBe(true);
  });

  it("toggle switches from dark to light", async (): Promise<void> => {
    localStorage.setItem("auraxis-theme", "dark");

    let result: ReturnType<typeof useTheme> | undefined;

    const TestComponent = defineComponent({
      setup() {
        result = useTheme();
        return {};
      },
      template: "<div />",
    });

    mount(TestComponent);
    await new Promise<void>((r) => setTimeout(r, 0));

    result?.toggle();
    expect(result?.isDark.value).toBe(false);
  });

  it("toggle persists choice to localStorage", (): void => {
    const { toggle } = useTheme();

    toggle(); // light -> dark
    expect(localStorage.getItem("auraxis-theme")).toBe("dark");

    toggle(); // dark -> light
    expect(localStorage.getItem("auraxis-theme")).toBe("light");
  });

  it("naiveTheme returns darkTheme object when resolved theme is dark", (): void => {
    const { naiveTheme, setPreference } = useTheme();
    setPreference("dark");
    expect(naiveTheme.value).not.toBeNull();
  });

  it("naiveTheme returns null when resolved theme is light", (): void => {
    const { naiveTheme } = useTheme();
    expect(naiveTheme.value).toBeNull();
  });
});
