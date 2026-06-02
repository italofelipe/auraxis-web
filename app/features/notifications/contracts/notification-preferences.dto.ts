/**
 * DTOs for the `/user/notification-preferences` endpoint (#836).
 */

export interface NotificationPreferenceDto {
  readonly category: string;
  readonly enabled: boolean;
  readonly global_opt_out: boolean;
}

export interface NotificationPreferencesResponseDto {
  readonly preferences: readonly NotificationPreferenceDto[];
}
