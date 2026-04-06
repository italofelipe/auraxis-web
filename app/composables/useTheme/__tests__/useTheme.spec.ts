/**
 * Unit tests for useTheme composable.
 *
 * useState (Nuxt) is guarded with a try/catch inside useTheme: when called
 * outside a Nuxt context (Vitest / happy-dom) it falls back to a plain ref so
 * the composable's reactive and localStorage logic can be tested in isolation.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to dark mode when localStorage is empty", () => {
    const { isDark } = useTheme();
    expect(isDark.value).toBe(true);
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

  it("toggle switches from dark to light", (): void => {
    const { isDark, toggle } = useTheme();

    expect(isDark.value).toBe(true);
    toggle();
    expect(isDark.value).toBe(false);
  });

  it("toggle switches from light to dark", async (): Promise<void> => {
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

    result?.toggle();
    expect(result?.isDark.value).toBe(true);
  });

  it("toggle persists choice to localStorage", (): void => {
    const { toggle } = useTheme();

    toggle(); // dark → light
    expect(localStorage.getItem("auraxis-theme")).toBe("light");

    toggle(); // light → dark
    expect(localStorage.getItem("auraxis-theme")).toBe("dark");
  });

  it("naiveTheme returns darkTheme object when isDark is true", (): void => {
    const { naiveTheme } = useTheme();
    expect(naiveTheme.value).not.toBeNull();
  });

  it("naiveTheme returns null when isDark is false", (): void => {
    const { isDark, naiveTheme } = useTheme();
    isDark.value = false;
    expect(naiveTheme.value).toBeNull();
  });
});
