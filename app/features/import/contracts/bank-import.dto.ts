/**
 * DTOs do import de extrato bancário, espelhando `/v2/bank-import/*` do api-v2.
 *
 * Nomes em snake_case exatamente como o backend responde — a conversão para o
 * domínio acontece só no mapper.
 *
 * Diferenças relevantes em relação a `/v2/import/*` (planilha):
 * - não existe passo de detecção de colunas: o formato do arquivo é a assinatura;
 * - o `amount` já vem **com sinal** (negativo = saída), sem campo de tipo;
 * - o upload devolve direto o preview, num passo só.
 */

/** Formatos que o backend aceita, na ordem em que `_detect_file_type` decide. */
export type BankImportFileTypeDto = "ofx" | "qfx" | "febraban_240" | "csv";

/** Bancos com mapeamento de CSV no api-v2 (`parsers/csv_mappings.BankId`). */
export type BankIdDto = "nubank" | "inter" | "c6" | "itau" | "xp";

export interface BankTransactionViewDto {
  readonly id: string;
  readonly date: string;
  readonly description: string;
  /** Decimal serializado como string, com sinal: negativo é saída. */
  readonly amount: string | number;
  readonly is_duplicate: boolean;
  /**
   * Sempre `null` hoje: `reconciliation.py` devolve `[]` por design enquanto o
   * v2 não tem modelo próprio de transação. Mapeado no DTO só para o contrato
   * não mentir — a UI não usa (fora de escopo em #1287).
   */
  readonly matched_existing_tx_id?: string | null;
  readonly confidence?: string | null;
  readonly match_reason?: string | null;
}

/** Resposta de `POST /v2/bank-import/upload` e de `GET /{token}/preview`. */
export interface BankUploadResponseDto {
  readonly preview_token: string;
  readonly expires_at: string;
  readonly file_type: BankImportFileTypeDto;
  readonly bank_id?: string | null;
  readonly detected_bank_id?: string | null;
  readonly detection_confidence?: number | null;
  readonly requires_confirmation?: boolean | null;
  readonly total_count: number;
  readonly duplicates_count: number;
  /** Sempre 0 por design — ver `matched_existing_tx_id`. */
  readonly reconciled_count?: number | null;
  readonly transactions: readonly BankTransactionViewDto[];
}

export interface BankImportRowErrorDto {
  readonly draft_id: string;
  readonly reason: string;
}

/** Resposta de `POST /v2/bank-import/{token}/confirm`. */
export interface BankConfirmResponseDto {
  readonly imported_count: number;
  readonly skipped_count?: number | null;
  readonly reconciled_count?: number | null;
  readonly errors?: readonly BankImportRowErrorDto[] | null;
}

export interface BankConfirmRequestDto {
  readonly exclude_ids: readonly string[];
}
