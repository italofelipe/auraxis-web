import type {
  ParsedRowDto,
  ReceivableEntryDto,
  RevenueSummaryDto,
} from "~/features/receivables/contracts/receivables.dto";
import type {
  ParsedRow,
  ReceivableEntry,
  ReceivableStatus,
  RevenueSummary,
} from "~/features/receivables/model/receivables";

/**
 * Maps a raw receivable entry DTO from the API into the internal ReceivableEntry view model.
 *
 * @param dto Raw receivable entry payload from the API (snake_case).
 * @returns Mapped ReceivableEntry view model (camelCase).
 */
export const mapReceivableEntryDto = (dto: ReceivableEntryDto): ReceivableEntry => {
  return {
    id: dto.id,
    description: dto.description,
    amount: dto.amount,
    expectedDate: dto.expected_date,
    receivedDate: dto.received_date,
    status: dto.status as ReceivableStatus,
    category: dto.category,
    createdAt: dto.created_at,
  };
};

/**
 * Maps a raw parsed row DTO from the API into the internal ParsedRow view model.
 *
 * @param dto Raw parsed row payload from the API (snake_case).
 * @returns Mapped ParsedRow view model (camelCase).
 */
export const mapParsedRowDto = (dto: ParsedRowDto): ParsedRow => {
  return {
    description: dto.description,
    amount: dto.amount,
    date: dto.date,
    category: dto.category,
    externalId: dto.external_id,
  };
};

/**
 * Maps a raw revenue summary DTO from the API into the internal RevenueSummary view model.
 *
 * @param dto Raw revenue summary payload from the API (snake_case).
 * @returns Mapped RevenueSummary view model (camelCase).
 */
export const mapRevenueSummaryDto = (dto: RevenueSummaryDto): RevenueSummary => {
  return {
    expectedTotal: dto.expected_total,
    receivedTotal: dto.received_total,
    pendingTotal: dto.pending_total,
  };
};
