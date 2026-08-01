import type {
  ConfirmResponseDto,
  DetectResponseDto,
  PreviewResponseDto,
  RejectedRowDto,
  TransactionDraftDto,
} from "~/features/import/contracts/import.dto";
import type {
  ImportColumnConfidence,
  ImportColumnMapping,
  ImportConfirmResult,
  ImportDetectResult,
  ImportMissingField,
  ImportPreview,
  ImportRejectedRow,
  ImportTransactionDraft,
} from "~/features/import/model/import";

const KNOWN_MISSING_FIELDS: readonly ImportMissingField[] = ["description", "amount"];

/**
 * Mantém só os campos que o wizard sabe perguntar. Um campo novo no backend
 * viraria uma pendência sem formulário — bloqueio sem saída para o usuário.
 *
 * @param raw Lista crua de campos faltantes.
 * @returns Campos faltantes que a UI consegue resolver.
 */
const mapMissingFields = (
  raw: readonly string[] | null | undefined,
): readonly ImportMissingField[] =>
  raw ? KNOWN_MISSING_FIELDS.filter((field) => raw.includes(field)) : [];

/**
 * Converte o mapeamento sugerido, tolerando campo ausente.
 *
 * @param dto Resposta de detecção.
 * @returns Mapeamento de colunas do domínio.
 */
const mapSuggestedMapping = (dto: DetectResponseDto): ImportColumnMapping => ({
  dateColumn: dto.suggested_mapping.date_column ?? "",
  descriptionColumn: dto.suggested_mapping.description_column ?? "",
  amountColumn: dto.suggested_mapping.amount_column ?? "",
  typeColumn: dto.suggested_mapping.type_column ?? "",
  sheetName: dto.suggested_mapping.sheet_name ?? dto.active_sheet ?? null,
});

/**
 * Converte a confiança por coluna, assumindo 0 quando o backend omite.
 *
 * @param dto Resposta de detecção.
 * @returns Confiança por campo do mapeamento.
 */
const mapConfidence = (dto: DetectResponseDto): ImportColumnConfidence => ({
  dateColumn: dto.confidence.date_column ?? 0,
  descriptionColumn: dto.confidence.description_column ?? 0,
  amountColumn: dto.confidence.amount_column ?? 0,
  typeColumn: dto.confidence.type_column ?? 0,
});

/**
 * Converte a resposta de detecção de colunas.
 *
 * @param dto Resposta crua do backend.
 * @returns Resultado de detecção do domínio.
 */
export const mapDetectResponse = (dto: DetectResponseDto): ImportDetectResult => ({
  fileType: dto.file_type,
  sheetNames: dto.sheet_names ?? [],
  activeSheet: dto.active_sheet ?? null,
  headers: dto.headers,
  sampleRows: dto.sample_rows,
  suggestedMapping: mapSuggestedMapping(dto),
  confidence: mapConfidence(dto),
});

/**
 * Converte uma linha do preview.
 *
 * @param dto Draft cru do backend.
 * @returns Draft do domínio.
 */
export const mapTransactionDraft = (
  dto: TransactionDraftDto,
): ImportTransactionDraft => ({
  id: dto.id,
  date: dto.date,
  description: dto.description,
  amount: String(dto.amount),
  type: dto.transaction_type,
  category: dto.category,
  confidence: dto.confidence,
  isDuplicate: dto.is_duplicate,
  missingFields: mapMissingFields(dto.missing_fields),
});

/**
 * Converte uma linha rejeitada pelo parser.
 *
 * @param dto Linha rejeitada crua.
 * @returns Linha rejeitada do domínio.
 */
export const mapRejectedRow = (dto: RejectedRowDto): ImportRejectedRow => ({
  lineNumber: dto.line_number,
  reason: dto.reason,
});

/**
 * Converte a resposta de preview.
 *
 * @param dto Resposta crua do backend.
 * @returns Preview do domínio.
 */
export const mapPreviewResponse = (dto: PreviewResponseDto): ImportPreview => {
  const transactions = dto.transactions.map(mapTransactionDraft);

  return {
    previewToken: dto.preview_token,
    expiresAt: dto.expires_at,
    fileType: dto.file_type,
    totalCount: dto.total_count,
    duplicatesCount: dto.duplicates_count,
    // Derivar dos drafts mantém a contagem coerente com o que a tela consegue
    // de fato perguntar, mesmo que o backend conte um campo novo.
    incompleteCount:
      dto.incomplete_count ??
      transactions.filter((draft) => draft.missingFields.length > 0).length,
    transactions,
    rejectedRows: (dto.rejected_rows ?? []).map(mapRejectedRow),
  };
};

/**
 * Converte a resposta do confirm.
 *
 * @param dto Resposta crua do backend.
 * @param fallbackSkipped Contagem usada quando o backend omite `skipped_count`.
 * @returns Resultado do import no domínio.
 */
export const mapConfirmResponse = (
  dto: ConfirmResponseDto,
  fallbackSkipped: number,
): ImportConfirmResult => ({
  importedCount: dto.imported_count,
  skippedCount: dto.skipped_count ?? fallbackSkipped,
  errors: (dto.errors ?? []).map((error) => ({
    draftId: error.draft_id,
    reason: error.reason,
  })),
});
