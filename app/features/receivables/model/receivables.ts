/**
 * View-model types for the receivables feature.
 *
 * These camelCase domain types are used by all UI components and composables.
 * They are derived from the raw API DTOs via `receivables.mapper.ts`.
 */

export type ReceivableStatus = "pending" | "received" | "cancelled";

export interface ReceivableEntry {
  readonly id: string;
  readonly description: string;
  readonly amount: number;
  readonly expectedDate: string;
  readonly receivedDate: string | null;
  readonly status: ReceivableStatus;
  readonly category: string;
  readonly createdAt: string;
}

export interface ParsedRow {
  readonly description: string;
  readonly amount: number;
  readonly date: string;
  readonly category: string;
  readonly externalId: string | null;
}

export interface RevenueSummary {
  readonly expectedTotal: number;
  readonly receivedTotal: number;
  readonly pendingTotal: number;
}
