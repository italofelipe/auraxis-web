/**
 * DTO → domínio. Puro: não conhece Vue, cache nem HTTP.
 *
 * Valores monetários atravessam como string do backend até a tela. Converter
 * para `number` no caminho reintroduz o ponto flutuante que o backend usa
 * `Decimal` justamente para evitar, e um extrato que não fecha por um centavo é
 * indistinguível de um bug do parser.
 */

import {
  FINANCIAL_NATURES,
  MATCH_STATUSES,
  type FinancialNature,
  type MatchEvidence,
  type MatchStatus,
  type StatementConfirmResult,
  type StatementDecision,
  type StatementDecisionAction,
  type StatementEntry,
  type StatementPreview,
  type StatementSummary,
} from "~/features/import/model/statement-import";
import type {
  MatchEvidenceDto,
  StatementConfirmResponseDto,
  StatementDecisionDto,
  StatementEntryDto,
  StatementPreviewDto,
  StatementSummaryDto,
} from "~/features/import/contracts/statement-import.dto";

/**
 * Converte a natureza do backend, aceitando apenas o vocabulário conhecido.
 *
 * Um valor fora da lista vira `null` em vez de ser propagado: a tela decide
 * cor, rótulo e se conta como transferência a partir dele, e um valor
 * desconhecido silenciosamente classificado erra os três.
 *
 * @param raw Valor recebido.
 * @returns A natureza, ou null.
 */
const toNature = (raw: string | null): FinancialNature | null =>
  raw !== null && (FINANCIAL_NATURES as readonly string[]).includes(raw)
    ? (raw as FinancialNature)
    : null;

/**
 * Converte o status de duplicidade, caindo em `unique` no desconhecido.
 *
 * `unique` é o fallback seguro: mostra a linha como nova, que o usuário pode
 * desmarcar. O contrário — assumir duplicata — esconderia um lançamento real.
 *
 * @param raw Valor recebido.
 * @returns O status.
 */
const toMatchStatus = (raw: string): MatchStatus =>
  (MATCH_STATUSES as readonly string[]).includes(raw) ? (raw as MatchStatus) : "unique";

/**
 * Converte a decisão anterior registrada para esta linha.
 *
 * @param raw Valor recebido.
 * @returns A ação, ou null quando não houve decisão anterior.
 */
const toPreviousDecision = (raw: string | null): StatementDecisionAction | null => {
  if (raw === "import" || raw === "link_existing" || raw === "ignore") {
    return raw;
  }
  return null;
};

/**
 * Converte a evidência de duplicidade.
 *
 * @param dto Evidência recebida.
 * @returns A evidência de domínio.
 */
const toEvidence = (dto: MatchEvidenceDto): MatchEvidence => ({
  agreed: dto.agreed ?? [],
  diverged: dto.diverged ?? [],
  dayDifference: dto.day_difference,
  reason: dto.reason ?? "",
  alternatives: dto.alternatives ?? 0,
  alreadyImported: dto.already_imported ?? false,
});

/**
 * Converte uma linha do extrato.
 *
 * @param dto Linha recebida.
 * @returns A linha de domínio.
 */
export const mapStatementEntry = (dto: StatementEntryDto): StatementEntry => ({
  lineIndex: dto.line_index,
  pageNumber: dto.page_number,
  kind: dto.kind === "balance_marker" ? "balance_marker" : "transaction",
  postingDate: dto.posting_date,
  transactionDate: dto.transaction_date,
  rawDescription: dto.raw_description,
  normalizedDescription: dto.normalized_description,
  amount: dto.amount,
  balance: dto.balance,
  currency: dto.currency,
  direction: dto.direction === "credit" ? "credit" : "debit",
  movementType: dto.movement_type,
  counterpartyName: dto.counterparty_name,
  financialNature: toNature(dto.financial_nature),
  suggestedCategory: dto.suggested_category,
  confidence: dto.confidence,
  rationale: dto.rationale,
  needsReview: dto.needs_review,
  recurrenceHint: dto.recurrence_hint,
  isNeutralNature: dto.is_neutral_nature,
  matchStatus: toMatchStatus(dto.match_status),
  matchedTransactionId: dto.matched_transaction_id,
  matchScore: dto.match_score,
  matchEvidence: toEvidence(dto.match_evidence),
  previousDecision: toPreviousDecision(dto.previous_decision),
  fingerprint: dto.fingerprint,
});

/**
 * Converte o resumo.
 *
 * @param dto Resumo recebido.
 * @returns O resumo de domínio.
 */
const mapSummary = (dto: StatementSummaryDto): StatementSummary => ({
  totalExtracted: dto.total_extracted,
  movements: dto.movements,
  balanceMarkers: dto.balance_markers,
  newCount: dto.new_count,
  exactDuplicates: dto.exact_duplicates,
  likelyDuplicates: dto.likely_duplicates,
  possibleDuplicates: dto.possible_duplicates,
  conflicts: dto.conflicts,
  needsReview: dto.needs_review,
  creditTotal: dto.credit_total,
  debitTotal: dto.debit_total,
  transferTotal: dto.transfer_total,
  rejectedLines: dto.rejected_lines,
});

/**
 * Converte a prévia completa.
 *
 * @param dto Prévia recebida.
 * @returns A prévia de domínio.
 */
export const mapStatementPreview = (dto: StatementPreviewDto): StatementPreview => ({
  previewToken: dto.preview_token,
  expiresAt: dto.expires_at,
  bankId: dto.bank_id,
  accountId: dto.account_id,
  holderName: dto.holder_name,
  periodStart: dto.period_start,
  periodEnd: dto.period_end,
  pageCount: dto.page_count,
  alreadyImportedFile: dto.already_imported_file,
  blockedByConflicts: dto.blocked_by_conflicts,
  summary: mapSummary(dto.summary),
  entries: (dto.entries ?? []).map(mapStatementEntry),
  rejected: dto.rejected ?? [],
});

/**
 * Converte uma decisão do domínio para o corpo que o backend espera.
 *
 * @param decision Decisão do usuário.
 * @returns O DTO.
 */
export const mapDecisionToDto = (decision: StatementDecision): StatementDecisionDto => ({
  line_index: decision.lineIndex,
  action: decision.action,
  matched_transaction_id: decision.matchedTransactionId ?? null,
  category: decision.category ?? null,
  financial_nature: decision.financialNature ?? null,
  title: decision.title ?? null,
  ignore_reason: decision.ignoreReason ?? null,
});

/**
 * Converte o resultado da confirmação.
 *
 * @param dto Resultado recebido.
 * @returns O resultado de domínio.
 */
export const mapStatementConfirmResult = (
  dto: StatementConfirmResponseDto,
): StatementConfirmResult => ({
  importedCount: dto.imported_count,
  linkedCount: dto.linked_count,
  ignoredCount: dto.ignored_count,
  skippedCount: dto.skipped_count,
  errors: (dto.errors ?? []).map((error) => ({
    lineIndex: error.draft_id,
    reason: error.reason,
  })),
});
