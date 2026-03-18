/**
 * Data Transfer Objects for the receivables feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to the view model before reaching
 * UI components.
 */

export interface ReceivableEntryDto {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly expected_date: string;
  readonly received_date: string | null;
  readonly status: string;
  readonly category: string;
  readonly created_at: string;
}

export interface ParsedRowDto {
  readonly description: string;
  readonly amount: number;
  readonly date: string;
  readonly category: string;
  readonly external_id: string | null;
}

export interface RevenueSummaryDto {
  readonly expected_total: number;
  readonly received_total: number;
  readonly pending_total: number;
}
