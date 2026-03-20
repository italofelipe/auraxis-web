/**
 * View-model types for the wallet feature.
 *
 * These camelCase domain types are used by all UI components and composables.
 * They are derived from the raw API DTOs via `wallet.mapper.ts`.
 */

export interface Position {
  readonly id: string;
  readonly name: string;
  readonly ticker?: string;
  readonly category: string;
  readonly invested: number;
  readonly currentValue: number;
  readonly variationPct: number;
}

export interface WalletSummary {
  readonly totalPatrimony: number;
  readonly investedValue: number;
  readonly currentValue: number;
  readonly periodVariation: number;
  readonly periodVariationPct: number;
  readonly positions: Position[];
  readonly lastUpdated: string;
}
