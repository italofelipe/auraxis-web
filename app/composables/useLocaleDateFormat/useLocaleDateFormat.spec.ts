import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";

import { useLocaleDateFormat } from "./useLocaleDateFormat";

vi.mock("vue-i18n", () => ({
  useI18n: (): { locale: ReturnType<typeof ref<string>> } => ({
    locale: ref("pt-BR"),
  }),
}));

describe("useLocaleDateFormat", (): void => {
  it("returns the three formatting helpers", (): void => {
    const helpers = useLocaleDateFormat();

    expect(helpers).toHaveProperty("formatDate");
    expect(helpers).toHaveProperty("formatMonthYear");
    expect(helpers).toHaveProperty("formatShortDate");
  });

  it("formatDate returns a non-empty string for a valid ISO date", (): void => {
    const { formatDate } = useLocaleDateFormat();

    const result = formatDate("2026-04-05");

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatDate accepts a Date object as input", (): void => {
    const { formatDate } = useLocaleDateFormat();
    const date = new Date("2026-04-05T00:00:00Z");

    const result = formatDate(date);

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatMonthYear returns a month/year string for a valid ISO date", (): void => {
    const { formatMonthYear } = useLocaleDateFormat();

    const result = formatMonthYear("2026-04-05");

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatShortDate returns a date string for a valid ISO date", (): void => {
    const { formatShortDate } = useLocaleDateFormat();

    const result = formatShortDate("2026-04-05");

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formatDate with explicit options passes them to Intl.DateTimeFormat", (): void => {
    const { formatDate } = useLocaleDateFormat();

    const fullResult = formatDate("2026-04-05", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const shortResult = formatDate("2026-04-05", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });

    // Different format options must produce different outputs
    expect(fullResult).not.toBe(shortResult);
  });
});
