import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  ParsedRowDto,
  ReceivableEntryDto,
  RevenueSummaryDto,
} from "~/features/receivables/contracts/receivables.dto";
import {
  mapParsedRowDto,
  mapReceivableEntryDto,
  mapRevenueSummaryDto,
} from "~/features/receivables/services/receivables.mapper";
import type {
  ParsedRow,
  ReceivableEntry,
  ReceivableStatus,
  RevenueSummary,
} from "~/features/receivables/model/receivables";

export interface CsvUploadPayload {
  content: string;
  column_map: Record<string, string>;
}

export interface CsvConfirmPayload {
  rows: ParsedRowDto[];
}

export interface CsvConfirmResult {
  created: number;
}

export interface CreateReceivablePayload {
  description: string;
  amount: number;
  expected_date: string;
  category: string;
}

export interface MarkReceivedPayload {
  received_date: string;
}

/**
 * API client for the receivables feature.
 *
 * Encapsulates all HTTP calls to the `/csv` and `/receivables` endpoints and
 * returns mapped view-model types ready for UI consumption.
 */
export class ReceivablesClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Uploads CSV content and column mapping for preview parsing.
   *
   * @param payload CSV content string and column map.
   * @returns Array of parsed row previews.
   */
  async uploadCsv(payload: CsvUploadPayload): Promise<ParsedRow[]> {
    const response = await this.#http.post<{ preview: ParsedRowDto[] }>("/csv/upload", payload);
    return response.data.preview.map(mapParsedRowDto);
  }

  /**
   * Confirms the import of previously parsed rows.
   *
   * @param rows Parsed rows to confirm and persist.
   * @returns Result with the count of created entries.
   */
  async confirmImport(rows: ParsedRowDto[]): Promise<CsvConfirmResult> {
    const response = await this.#http.post<CsvConfirmResult>("/csv/confirm", { rows });
    return response.data;
  }

  /**
   * Lists receivable entries, optionally filtered by status.
   *
   * @param status Optional status filter.
   * @returns Array of mapped receivable entries.
   */
  async listReceivables(status?: ReceivableStatus): Promise<ReceivableEntry[]> {
    const params = status ? { status } : {};
    const response = await this.#http.get<ReceivableEntryDto[]>("/receivables", { params });
    return response.data.map(mapReceivableEntryDto);
  }

  /**
   * Creates a new manual receivable entry.
   *
   * @param payload New receivable data.
   * @returns The created receivable entry.
   */
  async createReceivable(payload: CreateReceivablePayload): Promise<ReceivableEntry> {
    const response = await this.#http.post<ReceivableEntryDto>("/receivables", payload);
    return mapReceivableEntryDto(response.data);
  }

  /**
   * Marks a receivable as received on the given date.
   *
   * @param id Receivable entry identifier.
   * @param received_date ISO date string when the payment was received.
   * @returns Updated receivable entry.
   */
  async markReceived(id: string, received_date: string): Promise<ReceivableEntry> {
    const response = await this.#http.patch<ReceivableEntryDto>(
      `/receivables/${id}/receive`,
      { received_date },
    );
    return mapReceivableEntryDto(response.data);
  }

  /**
   * Deletes a receivable entry by identifier.
   *
   * @param id Receivable entry identifier.
   */
  async deleteReceivable(id: string): Promise<void> {
    await this.#http.delete(`/receivables/${id}`);
  }

  /**
   * Fetches the revenue summary for the authenticated user.
   *
   * @returns Mapped revenue summary view model.
   */
  async getSummary(): Promise<RevenueSummary> {
    const response = await this.#http.get<RevenueSummaryDto>("/receivables/summary");
    return mapRevenueSummaryDto(response.data);
  }
}

/**
 * Resolves the canonical receivables API client using the shared HTTP layer.
 *
 * @returns ReceivablesClient instance bound to the application HTTP adapter.
 */
export const useReceivablesClient = (): ReceivablesClient => {
  return new ReceivablesClient(useHttp());
};
