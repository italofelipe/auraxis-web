/**
 * Domain model for the spending-patterns radar (PROD-04, #568).
 *
 * Maps the backend response into a view model, ranks patterns by severity, and
 * builds the LGPD-safe transaction payload from the user's transaction list
 * (only amount/date/coarse labels — no personal identifiers).
 */

import type {
  SpendingPatternDto,
  SpendingPatternSeverityDto,
  SpendingPatternTransactionInputDto,
  SpendingPatternsLatestResponseDto,
  SpendingPatternsResponseDto,
} from "~/features/spending-patterns/contracts/spending-patterns.dto";

export interface SpendingPattern {
  description: string;
  frequency: string;
  averageValue: number;
  suggestedAction: string;
  severity: SpendingPatternSeverityDto;
}

/** Sort weight — higher severity first. */
const SEVERITY_RANK: Record<SpendingPatternSeverityDto, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * @param severity Pattern severity.
 * @returns Numeric rank (higher = more severe).
 */
export function severityRank(severity: SpendingPatternSeverityDto): number {
  return SEVERITY_RANK[severity] ?? 0;
}

/**
 * Maps a single pattern DTO to the domain model.
 *
 * @param dto Backend pattern.
 * @returns Domain pattern.
 */
export function mapPatternDto(dto: SpendingPatternDto): SpendingPattern {
  return {
    description: dto.description,
    frequency: dto.frequency,
    averageValue: dto.average_value,
    suggestedAction: dto.suggested_action,
    severity: dto.severity,
  };
}

/**
 * Maps the response into domain patterns sorted by descending severity.
 *
 * @param dto Backend response.
 * @returns Patterns ordered most-severe first.
 */
export function mapSpendingPatternsResponse(
  dto: SpendingPatternsResponseDto,
): SpendingPattern[] {
  return dto.patterns
    .map(mapPatternDto)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

/** Cached radar view model read from the quota-free read-only endpoint. */
export interface SpendingPatternsLatest {
  patterns: SpendingPattern[];
  generatedAt: string | null;
}

/**
 * Maps the read-only cached radar response into the view model. Patterns are
 * ordered most-severe first; `generatedAt` is null until the cron first runs.
 *
 * @param dto Backend read-only response.
 * @returns Cached radar view model.
 */
export function mapSpendingPatternsLatest(
  dto: SpendingPatternsLatestResponseDto,
): SpendingPatternsLatest {
  return {
    patterns: (dto.patterns ?? [])
      .map(mapPatternDto)
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity)),
    generatedAt: dto.generated_at ?? null,
  };
}

interface TransactionLike {
  readonly amount: string;
  readonly type: "income" | "expense";
  readonly due_date: string;
  readonly title: string;
  readonly description?: string | null;
}

/**
 * Builds the LGPD-safe transaction inputs from the user's transactions.
 *
 * Keeps only expenses with a positive, finite amount; the coarse label uses the
 * transaction title (no personal identifiers are forwarded).
 *
 * @param transactions Transactions from the list query.
 * @returns Payload transaction inputs.
 */
export function buildTransactionInputs(
  transactions: readonly TransactionLike[],
): SpendingPatternTransactionInputDto[] {
  const inputs: SpendingPatternTransactionInputDto[] = [];
  for (const tx of transactions) {
    if (tx.type !== "expense") {
      continue;
    }
    const amount = Number.parseFloat(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }
    inputs.push({
      amount,
      occurred_on: tx.due_date,
      category: tx.title || undefined,
      kind: "expense",
    });
  }
  return inputs;
}
