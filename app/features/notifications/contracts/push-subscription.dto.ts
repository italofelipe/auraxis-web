/**
 * Data Transfer Objects for the push-notifications feature.
 *
 * Mirrors the payload shape expected by `POST /notifications/subscribe` on
 * the Auraxis API. Kept in snake_case to match the REST contract.
 */

export interface PushSubscriptionKeysDto {
  readonly p256dh: string;
  readonly auth: string;
}

export interface PushSubscriptionPayloadDto {
  readonly endpoint: string;
  readonly expiration_time: number | null;
  readonly keys: PushSubscriptionKeysDto;
}
