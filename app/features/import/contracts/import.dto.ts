/**
 * DTOs do import de planilhas, espelhando `/v2/import/*` do api-v2.
 * Nomes em snake_case exatamente como o backend responde — a conversão para o
 * domínio acontece só no mapper.
 */

export type ImportFileTypeDto = "csv" | "xlsx";
export type ImportTransactionTypeDto = "income" | "expense";

export interface ColumnMappingDto {
  readonly date_column: string;
  readonly description_column: string;
  readonly amount_column: string;
  readonly type_column: string;
  readonly sheet_name?: string | null;
}

export interface ColumnConfidenceDto {
  readonly date_column?: number | null;
  readonly description_column?: number | null;
  readonly amount_column?: number | null;
  readonly type_column?: number | null;
}

export interface DetectResponseDto {
  readonly file_type: ImportFileTypeDto;
  readonly sheet_names?: readonly string[] | null;
  readonly active_sheet?: string | null;
  readonly headers: readonly string[];
  readonly sample_rows: readonly (readonly string[])[];
  readonly suggested_mapping: Partial<ColumnMappingDto>;
  readonly confidence: ColumnConfidenceDto;
}

export interface TransactionDraftDto {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  readonly amount: string | number;
  readonly transaction_type: ImportTransactionTypeDto;
  readonly category: string | null;
  readonly confidence: number | null;
  readonly is_duplicate: boolean;
  /** Campos que o arquivo não trouxe e o usuário precisa completar (#110). */
  readonly missing_fields?: readonly string[] | null;
}

export interface RejectedRowDto {
  readonly line_number: number;
  readonly reason: string;
}

export interface PreviewResponseDto {
  readonly preview_token: string;
  readonly expires_at: string;
  readonly file_type: ImportFileTypeDto;
  readonly total_count: number;
  readonly duplicates_count: number;
  readonly incomplete_count?: number | null;
  readonly transactions: readonly TransactionDraftDto[];
  readonly rejected_rows?: readonly RejectedRowDto[] | null;
}

export interface ImportRowErrorDto {
  readonly draft_id: string;
  readonly reason: string;
}

export interface ConfirmResponseDto {
  readonly imported_count: number;
  readonly skipped_count?: number | null;
  readonly errors?: readonly ImportRowErrorDto[] | null;
}

export interface ConfirmRequestDto {
  readonly preview_token: string;
  readonly exclude_ids: readonly string[];
  readonly completions: Readonly<Record<string, Readonly<Record<string, string>>>>;
  readonly use_generic_placeholders: boolean;
}
