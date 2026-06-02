import { describe, expect, it } from "vitest";

import {
  utilizationBand,
  utilizationBandClass,
  utilizationBarWidthPct,
} from "./utilization";

describe("utilizationBand", () => {
  it.each([
    [0, "low"],
    [50, "low"],
    [69.99, "low"],
    [70, "mid"],
    [80, "mid"],
    [90, "mid"],
    [90.01, "high"],
    [100, "high"],
    [120, "high"],
  ])("pct=%s → %s", (pct, expected) => {
    expect(utilizationBand(pct as number)).toBe(expected);
  });
});

describe("utilizationBandClass", () => {
  it("mapeia para a classe da faixa", () => {
    expect(utilizationBandClass(50)).toBe("cc-util--low");
    expect(utilizationBandClass(80)).toBe("cc-util--mid");
    expect(utilizationBandClass(95)).toBe("cc-util--high");
  });
});

describe("utilizationBarWidthPct", () => {
  it("clampa entre 0 e 100", () => {
    expect(utilizationBarWidthPct(-5)).toBe(0);
    expect(utilizationBarWidthPct(65)).toBe(65);
    expect(utilizationBarWidthPct(130)).toBe(100);
  });
});
