/**
 * Data Transfer Objects for the wallet feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend.  They are mapped to the view model before reaching
 * UI components.
 */

export interface PositionDto {
  readonly id: string;
  readonly name: string;
  readonly ticker?: string;
  readonly category: string;
  readonly invested: number;
  readonly current_value: number;
  readonly variation_pct: number;
}

export interface WalletSummaryDto {
  readonly total_patrimony: number;
  readonly invested_value: number;
  readonly current_value: number;
  readonly period_variation: number;
  readonly period_variation_pct: number;
  readonly positions: PositionDto[];
  readonly last_updated: string;
}
