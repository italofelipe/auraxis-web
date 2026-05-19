import type {
  PrivacyConsentKind,
  PrivacyConsentRecordDto,
} from "~/features/privacy/contracts/privacy-center.dto";

export interface PrivacyConsentViewModel {
  readonly kind: PrivacyConsentKind;
  readonly label: string;
  readonly description: string;
  readonly granted: boolean;
  readonly version: string;
  readonly source: string;
  readonly updatedAt: string;
}

const CONSENT_COPY: Record<string, { readonly label: string; readonly description: string }> = {
  terms: {
    label: "Termos de uso",
    description: "Regras de uso da plataforma e responsabilidades do usuário.",
  },
  privacy: {
    label: "Política de privacidade",
    description: "Tratamento de dados pessoais, bases legais e direitos LGPD.",
  },
  cookies: {
    label: "Cookies",
    description: "Preferências para cookies necessários, analytics e marketing.",
  },
  ai: {
    label: "Insights com IA",
    description: "Autorização para usar seus dados financeiros na geração de análises.",
  },
  marketing: {
    label: "Marketing",
    description: "Contato sobre novidades, conteúdos e ofertas do Auraxis.",
  },
};

export const REQUIRED_CONSENT_KINDS: readonly PrivacyConsentKind[] = [
  "terms",
  "privacy",
  "cookies",
  "ai",
  "marketing",
];

/**
 * Returns the latest consent per kind using created_at/revoked_at timestamps.
 *
 * @param records Raw consent records returned by the API.
 * @returns Map keyed by consent kind.
 */
export function latestConsentByKind(
  records: readonly PrivacyConsentRecordDto[],
): Map<PrivacyConsentKind, PrivacyConsentRecordDto> {
  const latest = new Map<PrivacyConsentKind, PrivacyConsentRecordDto>();

  for (const record of records) {
    const current = latest.get(record.kind);
    if (!current || getConsentTimestamp(record) >= getConsentTimestamp(current)) {
      latest.set(record.kind, record);
    }
  }

  return latest;
}

/**
 * Builds display-ready consent cards for the privacy center.
 *
 * @param records Raw consent records.
 * @returns Ordered list of known consent domains.
 */
export function buildConsentViewModels(
  records: readonly PrivacyConsentRecordDto[],
): readonly PrivacyConsentViewModel[] {
  const latest = latestConsentByKind(records);

  return REQUIRED_CONSENT_KINDS.map((kind) => {
    const record = latest.get(kind);
    const copy = CONSENT_COPY[kind] ?? {
      label: kind,
      description: "Consentimento registrado na plataforma.",
    };

    return {
      kind,
      label: copy.label,
      description: copy.description,
      granted: record?.action === "granted",
      version: record?.version ?? "—",
      source: record?.source ?? "—",
      updatedAt: formatPrivacyDate(record?.revoked_at ?? record?.created_at),
    };
  });
}

/**
 * Formats an ISO date/time into pt-BR date and time.
 *
 * @param value Date-like string from the API.
 * @returns Human-readable date or dash placeholder.
 */
export function formatPrivacyDate(value: string | null | undefined): string {
  if (!value) { return "—"; }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) { return "—"; }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Extracts a comparable timestamp from a consent record.
 *
 * @param record Consent record.
 * @returns Milliseconds since epoch, or 0 when absent/invalid.
 */
function getConsentTimestamp(record: PrivacyConsentRecordDto): number {
  const raw = record.revoked_at ?? record.created_at;
  if (!raw) { return 0; }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}
