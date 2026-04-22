import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";

export type TransactionExportFormat = "csv" | "pdf";

export interface TransactionExportFilters {
  readonly format: TransactionExportFormat;
  readonly start_date?: string;
  readonly end_date?: string;
}

export interface TransactionExportBlob {
  readonly blob: Blob;
  readonly filename: string;
  readonly contentType: string;
}

const MIME_BY_FORMAT: Record<TransactionExportFormat, string> = {
  csv: "text/csv",
  pdf: "application/pdf",
};

/**
 * Extracts a filename from Content-Disposition, falling back to a dated default.
 *
 * @param header - Raw Content-Disposition header value.
 * @param format - Chosen export format (used for the fallback extension).
 * @returns Sanitized filename.
 */
const resolveFilename = (
  header: string | undefined | null,
  format: TransactionExportFormat,
): string => {
  if (header) {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(header);
    if (match && match[1]) {
      return decodeURIComponent(match[1].trim());
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return `auraxis-transactions-${stamp}.${format}`;
};

/**
 * API client responsible for the transactions export endpoint.
 *
 * The endpoint is gated by the `export_pdf` entitlement on the backend; the
 * client does NOT pre-check — paywall resolution happens on the UI layer via
 * `useEntitlementQuery`.
 */
export class TransactionsExportClient {
  readonly #http: AxiosInstance;

  /**
   * @param http - Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Downloads the exported transactions file for the given range.
   *
   * @param filters - Range + format options.
   * @returns The raw blob plus resolved filename and content type.
   */
  async exportTransactions(filters: TransactionExportFilters): Promise<TransactionExportBlob> {
    const response = await this.#http.get<Blob>("/transactions/export", {
      params: {
        format: filters.format,
        start_date: filters.start_date,
        end_date: filters.end_date,
      },
      responseType: "blob",
    });

    const filename = resolveFilename(
      response.headers?.["content-disposition"] as string | undefined,
      filters.format,
    );
    const contentType = (response.headers?.["content-type"] as string | undefined)
      ?? MIME_BY_FORMAT[filters.format];

    return { blob: response.data, filename, contentType };
  }
}

/**
 * Factory that wires the transactions-export client to the default HTTP composable.
 *
 * @returns Ready-to-use client instance.
 */
export const useTransactionsExportClient = (): TransactionsExportClient => {
  return new TransactionsExportClient(useHttp());
};
