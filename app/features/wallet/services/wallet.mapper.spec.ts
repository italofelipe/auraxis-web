import { describe, expect, it } from "vitest";

import { mapPositionDto, mapWalletSummaryDto } from "./wallet.mapper";
import type { PositionDto, WalletSummaryDto } from "~/features/wallet/contracts/wallet.dto";

/**
 * Builds a minimal PositionDto fixture for testing.
 *
 * @param overrides Optional field overrides.
 * @returns PositionDto fixture.
 */
const makePositionDto = (overrides: Partial<PositionDto> = {}): PositionDto => ({
  id: "p-1",
  name: "Ações Brasil",
  ticker: "BOVA11",
  category: "Renda Variável",
  invested: 10000,
  current_value: 11500,
  variation_pct: 15.0,
  ...overrides,
});

/**
 * Builds a minimal WalletSummaryDto fixture for testing.
 *
 * @param overrides Optional field overrides.
 * @returns WalletSummaryDto fixture.
 */
const makeWalletSummaryDto = (overrides: Partial<WalletSummaryDto> = {}): WalletSummaryDto => ({
  total_patrimony: 87500,
  invested_value: 72000,
  current_value: 87500,
  period_variation: 15500,
  period_variation_pct: 21.53,
  last_updated: "2026-03-17T00:00:00.000Z",
  positions: [makePositionDto()],
  ...overrides,
});

describe("mapPositionDto", () => {
  it("converts snake_case DTO fields to camelCase view model", () => {
    const dto = makePositionDto();
    const result = mapPositionDto(dto);

    expect(result.id).toBe("p-1");
    expect(result.name).toBe("Ações Brasil");
    expect(result.ticker).toBe("BOVA11");
    expect(result.category).toBe("Renda Variável");
    expect(result.invested).toBe(10000);
    expect(result.currentValue).toBe(11500);
    expect(result.variationPct).toBe(15.0);
  });

  it("preserves undefined ticker when not provided in DTO", () => {
    const dto = makePositionDto({ ticker: undefined });
    const result = mapPositionDto(dto);

    expect(result.ticker).toBeUndefined();
  });
});

describe("mapWalletSummaryDto", () => {
  it("converts all top-level snake_case fields to camelCase", () => {
    const dto = makeWalletSummaryDto({ positions: [] });
    const result = mapWalletSummaryDto(dto);

    expect(result.totalPatrimony).toBe(87500);
    expect(result.investedValue).toBe(72000);
    expect(result.currentValue).toBe(87500);
    expect(result.periodVariation).toBe(15500);
    expect(result.periodVariationPct).toBe(21.53);
    expect(result.lastUpdated).toBe("2026-03-17T00:00:00.000Z");
    expect(result.positions).toHaveLength(0);
  });

  it("maps every position in the positions array", () => {
    const dto = makeWalletSummaryDto({
      positions: [
        makePositionDto({ id: "a" }),
        makePositionDto({ id: "b" }),
      ],
    });
    const result = mapWalletSummaryDto(dto);

    expect(result.positions).toHaveLength(2);
    expect(result.positions[0]?.id).toBe("a");
    expect(result.positions[1]?.id).toBe("b");
  });

  it("correctly maps currentValue from position current_value", () => {
    const dto = makeWalletSummaryDto({
      positions: [makePositionDto({ current_value: 99999 })],
    });
    const result = mapWalletSummaryDto(dto);

    expect(result.positions[0]?.currentValue).toBe(99999);
  });
});
