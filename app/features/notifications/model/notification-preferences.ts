/**
 * Domain model for user notification preferences (UX-02-1, #561).
 *
 * Mirrors the Flask backend `/user/notification-preferences` contract (#836):
 * per-category opt-in/opt-out plus a per-record global opt-out flag.
 */

import type {
  NotificationPreferenceDto,
  NotificationPreferencesResponseDto,
} from "~/features/notifications/contracts/notification-preferences.dto";

/** Canonical notification categories accepted by the backend. */
export const NOTIFICATION_CATEGORIES = [
  "due_soon",
  "wallet",
  "goals",
  "transactions",
  "subscription",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface NotificationPreference {
  category: NotificationCategory;
  enabled: boolean;
  globalOptOut: boolean;
}

/**
 * @param value Candidate category string.
 * @returns Whether the value is a known notification category.
 */
export function isNotificationCategory(value: string): value is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Maps a single preference DTO to the domain model.
 *
 * @param dto Backend preference record.
 * @returns Domain preference.
 */
export function mapPreferenceDto(dto: NotificationPreferenceDto): NotificationPreference {
  return {
    category: dto.category as NotificationCategory,
    enabled: dto.enabled,
    globalOptOut: dto.global_opt_out,
  };
}

/**
 * Maps the list response into domain preferences, keeping only known categories.
 *
 * @param dto Backend list response.
 * @returns Domain preferences.
 */
export function mapPreferencesResponse(
  dto: NotificationPreferencesResponseDto,
): NotificationPreference[] {
  return dto.preferences
    .filter((p) => isNotificationCategory(p.category))
    .map(mapPreferenceDto);
}

/**
 * Builds a complete preference list for the UI, defaulting any category the
 * backend has not persisted yet to enabled (opt-out model).
 *
 * @param preferences Persisted domain preferences.
 * @returns One entry per known category.
 */
export function withDefaultCategories(
  preferences: readonly NotificationPreference[],
): NotificationPreference[] {
  const byCategory = new Map(preferences.map((p) => [p.category, p]));
  return NOTIFICATION_CATEGORIES.map(
    (category) =>
      byCategory.get(category) ?? { category, enabled: true, globalOptOut: false },
  );
}

/**
 * Serializes a domain preference into the PATCH payload shape.
 *
 * @param preference Domain preference.
 * @returns DTO accepted by the backend upsert.
 */
export function toPreferencePayload(
  preference: NotificationPreference,
): NotificationPreferenceDto {
  return {
    category: preference.category,
    enabled: preference.enabled,
    global_opt_out: preference.globalOptOut,
  };
}
