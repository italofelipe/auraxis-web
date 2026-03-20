import type { PositionDto, WalletSummaryDto } from "~/features/wallet/contracts/wallet.dto";
import type { Position, WalletSummary } from "~/features/wallet/model/wallet";

/**
 * Maps a raw position DTO from the API into the internal Position view model.
 *
 * @param dto Raw position payload from the API (snake_case).
 * @returns Mapped Position view model (camelCase).
 */
export const mapPositionDto = (dto: PositionDto): Position => {
  return {
    id: dto.id,
    name: dto.name,
    ticker: dto.ticker,
    category: dto.category,
    invested: dto.invested,
    currentValue: dto.current_value,
    variationPct: dto.variation_pct,
  };
};

/**
 * Maps a raw wallet summary DTO from the API into the internal WalletSummary view model.
 *
 * @param dto Raw wallet summary payload from the API (snake_case).
 * @returns Mapped WalletSummary view model (camelCase).
 */
export const mapWalletSummaryDto = (dto: WalletSummaryDto): WalletSummary => {
  return {
    totalPatrimony: dto.total_patrimony,
    investedValue: dto.invested_value,
    currentValue: dto.current_value,
    periodVariation: dto.period_variation,
    periodVariationPct: dto.period_variation_pct,
    positions: dto.positions.map(mapPositionDto),
    lastUpdated: dto.last_updated,
  };
};
