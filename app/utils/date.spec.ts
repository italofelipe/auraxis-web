import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatDate, formatDateRange, formatRelativeTime } from "./date";

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("formata uma instância de Date como dd/mm/yyyy", () => {
    const date = new Date("2026-03-28T12:00:00.000Z");
    expect(formatDate(date)).toMatch(/28\/03\/2026/);
  });

  it("formata uma string ISO como dd/mm/yyyy", () => {
    expect(formatDate("2024-01-15T00:00:00.000Z")).toMatch(/15\/01\/2024/);
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------

describe("formatRelativeTime", () => {
  const NOW = new Date("2026-03-28T12:00:00.000Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna string relativa para diferença em segundos", () => {
    const past = new Date(NOW - 30_000); // 30 s atrás
    const result = formatRelativeTime(past);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("retorna string relativa para diferença em minutos", () => {
    const past = new Date(NOW - 5 * 60_000); // 5 min atrás
    const result = formatRelativeTime(past);
    expect(result).toMatch(/minuto/);
  });

  it("retorna string relativa para diferença em horas", () => {
    const past = new Date(NOW - 3 * 3_600_000); // 3 h atrás
    const result = formatRelativeTime(past);
    expect(result).toMatch(/hora/);
  });

  it("retorna string relativa para diferença em dias", () => {
    const past = new Date(NOW - 2 * 86_400_000); // 2 dias atrás
    const result = formatRelativeTime(past);
    // numeric: "always" → "há 2 dias" (never "anteontem")
    expect(result).toMatch(/\d+/);
    expect(result.length).toBeGreaterThan(0);
  });

  it("aceita string ISO como entrada", () => {
    const pastIso = new Date(NOW - 86_400_000).toISOString();
    const result = formatRelativeTime(pastIso);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// formatDateRange
// ---------------------------------------------------------------------------

describe("formatDateRange", () => {
  it("formata intervalo de datas com separador en-dash", () => {
    const result = formatDateRange(
      "2026-01-01T00:00:00.000Z",
      "2026-01-31T00:00:00.000Z",
    );
    expect(result).toContain("–");
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("aceita instâncias de Date", () => {
    const start = new Date("2026-03-01T00:00:00.000Z");
    const end = new Date("2026-03-31T00:00:00.000Z");
    const result = formatDateRange(start, end);
    expect(result).toContain("–");
  });

  it("retorna duas datas separadas pelo delimitador", () => {
    const result = formatDateRange(
      "2026-01-01T00:00:00.000Z",
      "2026-12-31T00:00:00.000Z",
    );
    const parts = result.split(" – ");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(parts[1]).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});
