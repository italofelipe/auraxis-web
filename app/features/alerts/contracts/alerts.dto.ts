/**
 * Data Transfer Objects for the alerts feature.
 *
 * These types represent the raw API contract (snake_case) returned by
 * the Auraxis backend. They are mapped to the view model before reaching
 * UI components.
 */

export interface AlertDto {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly severity: "info" | "warning" | "critical";
  readonly read_at: string | null;
  readonly created_at: string;
}

export interface AlertPreferenceDto {
  readonly id: string;
  readonly category: string;
  readonly enabled: boolean;
  readonly channels: string[];
}
