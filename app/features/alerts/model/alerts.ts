/**
 * View-model types for the alerts feature.
 *
 * These camelCase domain types are used by all UI components and composables.
 * They are derived from the raw API DTOs via `alerts.mapper.ts`.
 */

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly severity: AlertSeverity;
  readonly readAt: string | null;
  readonly createdAt: string;
}

export interface AlertPreference {
  readonly id: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly channels: string[];
}

export interface AlertsPage {
  readonly items: Alert[];
  readonly total: number;
}

export interface UpdateAlertPreferencePayload {
  readonly enabled: boolean;
  readonly channels: string[];
}
