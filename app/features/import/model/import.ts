/** Tipos de domínio do import de planilhas. */

export type ImportFileType = "csv" | "xlsx";
export type ImportTransactionType = "income" | "expense";

/** Campo que o arquivo não trouxe e que a conferência pergunta ao usuário. */
export type ImportMissingField = "description" | "amount";

/** Campos do mapeamento de colunas, na ordem em que são perguntados. */
export const IMPORT_MAPPING_FIELDS = [
  "dateColumn",
  "descriptionColumn",
  "amountColumn",
  "typeColumn",
] as const;

export type ImportMappingFieldKey = (typeof IMPORT_MAPPING_FIELDS)[number];

export interface ImportColumnMapping {
  readonly dateColumn: string;
  readonly descriptionColumn: string;
  readonly amountColumn: string;
  readonly typeColumn: string;
  readonly sheetName: string | null;
}

export type ImportColumnConfidence = Readonly<Record<ImportMappingFieldKey, number>>;

export interface ImportDetectResult {
  readonly fileType: ImportFileType;
  readonly sheetNames: readonly string[];
  readonly activeSheet: string | null;
  readonly headers: readonly string[];
  readonly sampleRows: readonly (readonly string[])[];
  readonly suggestedMapping: ImportColumnMapping;
  readonly confidence: ImportColumnConfidence;
}

export interface ImportTransactionDraft {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: string;
  readonly type: ImportTransactionType;
  readonly category: string | null;
  readonly confidence: number | null;
  readonly isDuplicate: boolean;
  readonly missingFields: readonly ImportMissingField[];
}

/** Linha que existia no arquivo e o parser não conseguiu ler. */
export interface ImportRejectedRow {
  readonly lineNumber: number;
  readonly reason: string;
}

export interface ImportPreview {
  readonly previewToken: string;
  readonly expiresAt: string;
  readonly fileType: ImportFileType;
  readonly totalCount: number;
  readonly duplicatesCount: number;
  readonly incompleteCount: number;
  readonly transactions: readonly ImportTransactionDraft[];
  readonly rejectedRows: readonly ImportRejectedRow[];
}

/** O que o usuário respondeu na conferência: `{ draftId: { campo: valor } }`. */
export type ImportCompletions = Readonly<
  Record<string, Readonly<Partial<Record<ImportMissingField, string>>>>
>;

export interface ImportRowError {
  readonly draftId: string;
  readonly reason: string;
}

export interface ImportConfirmResult {
  readonly importedCount: number;
  readonly skippedCount: number;
  readonly errors: readonly ImportRowError[];
}

export interface ImportConfirmCommand {
  readonly previewToken: string;
  readonly excludeIds: readonly string[];
  readonly completions?: ImportCompletions;
  readonly useGenericPlaceholders?: boolean;
}

export interface ImportPreviewCommand {
  readonly file: File;
  readonly mapping: ImportColumnMapping;
}

/**
 * Abaixo disto a detecção automática não é confiável o bastante e o wizard
 * pergunta a coluna ao usuário. Mesmo limiar usado no app.
 */
export const IMPORT_CONFIDENCE_THRESHOLD = 0.7;

/** Limite de upload aceito pelo backend (413 acima disso). */
export const IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const IMPORT_ACCEPTED_EXTENSIONS = [".csv", ".xlsx"] as const;
