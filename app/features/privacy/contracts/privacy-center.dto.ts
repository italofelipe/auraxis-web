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

export interface PrivacyExportMetadataDto {
  readonly generated_at?: string | null;
  readonly user_id?: string | null;
  readonly registry_version?: string | null;
  readonly scope?: string | null;
}

/**
 * Pacote LGPD completo retornado por `GET /user/me/export` (#1119): dados por
 * entidade do registry + seção `retentions` com o que fica retido por lei.
 */
export interface PrivacyDataExportPackageDto {
  readonly metadata?: PrivacyExportMetadataDto;
  readonly retentions?: readonly Record<string, unknown>[];
  readonly [entity: string]: unknown;
}

export interface V2EnvelopeDto<T> {
  readonly success?: boolean;
  readonly message?: string;
  readonly data: T;
}
