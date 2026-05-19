export type PrivacyConsentKind = "terms" | "privacy" | "cookies" | "ai" | "marketing" | string;
export type PrivacyConsentAction = "granted" | "revoked" | "declined" | string;

export interface PrivacyConsentRecordDto {
  readonly id?: string;
  readonly kind: PrivacyConsentKind;
  readonly action: PrivacyConsentAction;
  readonly version?: string | null;
  readonly source?: string | null;
  readonly created_at?: string | null;
  readonly revoked_at?: string | null;
}

export interface PrivacyConsentListDto {
  readonly items: readonly PrivacyConsentRecordDto[];
  readonly total?: number;
}

export interface PrivacyDataExportDto {
  readonly request_id: string;
  readonly status: "queued" | "ready" | "processing" | string;
  readonly download_url?: string | null;
  readonly expires_at?: string | null;
}

export interface PrivacyDeletionRequestDto {
  readonly request_id: string;
  readonly status: "queued" | "scheduled" | "processing" | string;
  readonly scheduled_for?: string | null;
}

export interface PrivacyDeletionRequestPayload {
  readonly password: string;
  readonly reason?: string | null;
}

export interface V2EnvelopeDto<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data: T;
}
