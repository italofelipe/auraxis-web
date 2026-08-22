/**
 * DTOs de `/v2/bank-import/statements/*`, em snake_case como o backend envia.
 *
 * Escritos à mão porque `/v2/*` não entra no snapshot OpenAPI que gera
 * `app/shared/types/generated/` — a mesma decisão já tomada para o import de
 * planilha e o de extrato.
 */

export interface MatchEvidenceDto {
  readonly agreed: string[];
  readonly diverged: string[];
  readonly day_difference: number | null;
  readonly reason: string;
  readonly alternatives: number;
  readonly already_imported: boolean;
}

export interface StatementEntryDto {
  readonly line_index: number;
  readonly page_number: number;
  readonly kind: string;
  readonly posting_date: string;
  readonly transaction_date: string | null;
  readonly raw_description: string;
  readonly normalized_description: string;
  readonly amount: string;
  readonly balance: string | null;
  readonly currency: string;
  readonly direction: string;
  readonly movement_type: string;
  readonly counterparty_name: string | null;
  readonly financial_nature: string | null;
  readonly suggested_category: string | null;
  readonly confidence: string;
  readonly rationale: string | null;
  readonly needs_review: boolean;
  readonly recurrence_hint: boolean;
  readonly is_neutral_nature: boolean;
  readonly match_status: string;
  readonly matched_transaction_id: string | null;
  readonly match_score: string;
  readonly match_evidence: MatchEvidenceDto;
  readonly previous_decision: string | null;
  readonly fingerprint: string;
  readonly prefix_hash: string;
}

export interface StatementSummaryDto {
  readonly total_extracted: number;
  readonly movements: number;
  readonly balance_markers: number;
  readonly new_count: number;
  readonly exact_duplicates: number;
  readonly likely_duplicates: number;
  readonly possible_duplicates: number;
  readonly conflicts: number;
  readonly needs_review: number;
  readonly credit_total: string;
  readonly debit_total: string;
  readonly transfer_total: string;
  readonly rejected_lines: number;
}

export interface StatementPreviewDto {
  readonly preview_token: string;
  readonly expires_at: string;
  readonly file_type: string;
  readonly bank_id: string;
  readonly account_id: string;
  readonly holder_name: string | null;
  readonly period_start: string | null;
  readonly period_end: string | null;
  readonly page_count: number;
  readonly file_sha256: string;
  readonly already_imported_file: boolean;
  readonly blocked_by_conflicts: boolean;
  readonly summary: StatementSummaryDto;
  readonly entries: StatementEntryDto[];
  readonly rejected: string[];
}

export interface StatementDecisionDto {
  readonly line_index: number;
  readonly action: string;
  readonly matched_transaction_id?: string | null;
  readonly category?: string | null;
  readonly financial_nature?: string | null;
  readonly title?: string | null;
  readonly ignore_reason?: string | null;
}

export interface StatementConfirmRequestDto {
  readonly account_id: string;
  readonly decisions: StatementDecisionDto[];
}

export interface StatementConfirmResponseDto {
  readonly imported_count: number;
  readonly linked_count: number;
  readonly ignored_count: number;
  readonly skipped_count: number;
  readonly errors: { readonly draft_id: string; readonly reason: string }[];
}
