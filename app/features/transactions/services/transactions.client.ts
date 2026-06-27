import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  CreateTransactionPayload,
  TransactionDto,
  TransactionStatusDto,
  TransactionTypeDto,
  UpdateTransactionPayload,
} from "~/features/transactions/contracts/transaction.dto";

/**
 * Raw envelope returned by the backend for a successful transaction creation.
 *
 * The backend's `_compat_success` helper always wraps the data object, and the
 * key inside `data` is dynamic ("transaction" for single, "transactions" for
 * installments). We accept both shapes here.
 */
interface TransactionCreateResponseEnvelope {
  readonly message?: string;
  readonly data?: {
    readonly transaction?: TransactionDto | TransactionDto[];
    readonly transactions?: TransactionDto | TransactionDto[];
  };
  // Legacy flat shape (no envelope) — kept for backward compat:
  readonly transaction?: TransactionDto | TransactionDto[];
  readonly transactions?: TransactionDto | TransactionDto[];
}

/** Bloco de paginação retornado em `meta.pagination` pela API v2. */
interface PaginationMeta {
  readonly page: number;
  readonly pages: number;
  readonly per_page: number;
  readonly total: number;
}

/**
 * Raw envelope returned by GET /transactions.
 *
 * Accepts both the v2 envelope shape (`data.transactions`) and a bare
 * array for backward compatibility.
 */
interface TransactionListResponseEnvelope {
  readonly data?: {
    readonly transactions?: TransactionDto[];
  };
  readonly transactions?: TransactionDto[];
  readonly meta?: {
    readonly pagination?: PaginationMeta;
  };
}

/** Tamanho de página usado ao varrer todas as páginas (`listAllTransactions`). */
const LIST_ALL_PER_PAGE = 100;

/** Optional filters accepted by GET /transactions. */
export interface ListTransactionsFilters {
  /** Filter by transaction type. */
  readonly type?: TransactionTypeDto;
  /** Filter by lifecycle status. */
  readonly status?: TransactionStatusDto;
  /** Earliest due_date to include (YYYY-MM-DD). */
  readonly start_date?: string;
  /** Latest due_date to include (YYYY-MM-DD). */
  readonly end_date?: string;
  /** Filter by tag UUID. */
  readonly tag_id?: string;
  /** Filter by credit card UUID. */
  readonly credit_card_id?: string;
  /** 1-based page index (server-side pagination). */
  readonly page?: number;
  /** Page size (server-side pagination). */
  readonly per_page?: number;
}

/**
 * API client for the transactions feature.
 *
 * Encapsulates HTTP calls to the `/transactions` endpoints.
 */
export class TransactionsClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Creates one or more transaction entries.
   *
   * When `payload.is_installment` is true the backend generates
   * `payload.installment_count` individual transaction records and returns
   * them all in the response array.
   *
   * @param payload Transaction creation payload.
   * @returns Array of created TransactionDto records (one per installment).
   */
  async createTransaction(payload: CreateTransactionPayload): Promise<TransactionDto[]> {
    const response = await this.#http.post<TransactionCreateResponseEnvelope>(
      "/transactions",
      payload,
    );

    const raw = response.data;

    // Unwrap both envelope shapes the backend may return.
    const items =
      raw.data?.transactions
      ?? raw.data?.transaction
      ?? raw.transactions
      ?? raw.transaction
      ?? [];

    return Array.isArray(items) ? items : [items];
  }

  /**
   * Permanently removes a transaction.
   *
   * @param id UUID of the transaction to delete.
   * @param scope `"series"` soft-deletes the whole recurring series; the
   *   default (`"occurrence"`) removes only this transaction.
   */
  async deleteTransaction(
    id: string,
    scope: "occurrence" | "series" = "occurrence",
  ): Promise<void> {
    const query = scope === "series" ? "?scope=series" : "";
    await this.#http.delete(`/transactions/${id}${query}`);
  }

  /**
   * Updates a transaction's status.
   *
   * Used primarily to mark a transaction as "paid". The backend accepts any
   * valid TransactionStatusDto via PATCH /transactions/:id.
   *
   * @param id    UUID of the transaction to update.
   * @param status New lifecycle status.
   * @returns Updated TransactionDto.
   */
  async updateStatus(id: string, status: TransactionStatusDto): Promise<TransactionDto> {
    const response = await this.#http.patch<
      | { data?: { transaction?: TransactionDto }; transaction?: TransactionDto }
      | TransactionDto
    >(`/transactions/${id}`, { status });

    const raw = response.data as {
      data?: { transaction?: TransactionDto };
      transaction?: TransactionDto;
    } & Partial<TransactionDto>;

    return raw.data?.transaction ?? raw.transaction ?? (raw as unknown as TransactionDto);
  }

  /**
   * Updates an existing transaction with partial changes.
   *
   * Sends only the changed fields to PATCH /transactions/:id.
   * The backend merges the partial payload into the existing record.
   *
   * @param id      UUID of the transaction to update.
   * @param payload Partial fields to update.
   * @returns Updated TransactionDto.
   */
  async updateTransaction(id: string, payload: UpdateTransactionPayload): Promise<TransactionDto> {
    const response = await this.#http.patch<
      | { data?: { transaction?: TransactionDto }; transaction?: TransactionDto }
      | TransactionDto
    >(`/transactions/${id}`, payload);

    const raw = response.data as {
      data?: { transaction?: TransactionDto };
      transaction?: TransactionDto;
    } & Partial<TransactionDto>;

    return raw.data?.transaction ?? raw.transaction ?? (raw as unknown as TransactionDto);
  }

  /**
   * Lists the authenticated user's soft-deleted transactions.
   *
   * These are records still retained in the database after DELETE
   * (soft delete) and can be restored individually.
   *
   * @returns Array of soft-deleted TransactionDto records.
   */
  async listDeletedTransactions(): Promise<TransactionDto[]> {
    const response = await this.#http.get<TransactionListResponseEnvelope | TransactionDto[]>(
      "/transactions/deleted",
    );

    const raw = response.data;
    if (Array.isArray(raw)) { return raw; }
    return (raw as TransactionListResponseEnvelope).data?.transactions
      ?? (raw as TransactionListResponseEnvelope).transactions
      ?? [];
  }

  /**
   * Restores a previously soft-deleted transaction.
   *
   * @param id UUID of the transaction to restore.
   * @returns The restored TransactionDto.
   */
  async restoreTransaction(id: string): Promise<TransactionDto> {
    const response = await this.#http.patch<
      | { data?: { transaction?: TransactionDto }; transaction?: TransactionDto }
      | TransactionDto
    >(`/transactions/restore/${id}`);

    const raw = response.data as {
      data?: { transaction?: TransactionDto };
      transaction?: TransactionDto;
    } & Partial<TransactionDto>;

    return raw.data?.transaction ?? raw.transaction ?? (raw as unknown as TransactionDto);
  }

  /**
   * Lists the authenticated user's transactions, optionally filtered by
   * type, status and date range.
   *
   * @param filters Optional query-parameter filters.
   * @returns Array of TransactionDto records.
   */
  async listTransactions(filters?: ListTransactionsFilters): Promise<TransactionDto[]> {
    const { items } = await this.#fetchTransactionsPage(filters);
    return items;
  }

  /**
   * Lists the COMPLETE set of transactions for the given filters by following
   * server-side pagination.
   *
   * `listTransactions` only returns the first page (the backend defaults to
   * `per_page: 10`), which silently truncates any aggregation that assumes it
   * holds every record in the range. This method requests a large page and,
   * if the response reports more pages, fetches the remainder and concatenates
   * them in order. Use it whenever correctness depends on having all records
   * (e.g. the credit-cards billing window).
   *
   * @param filters Optional query-parameter filters.
   * @returns Every TransactionDto matching the filters, across all pages.
   */
  async listAllTransactions(filters?: ListTransactionsFilters): Promise<TransactionDto[]> {
    const first = await this.#fetchTransactionsPage({
      ...filters,
      page: 1,
      per_page: LIST_ALL_PER_PAGE,
    });

    if (first.pages <= 1) {
      return first.items;
    }

    const remaining = await Promise.all(
      Array.from({ length: first.pages - 1 }, (_unused, index) =>
        this.#fetchTransactionsPage({
          ...filters,
          page: index + 2,
          per_page: LIST_ALL_PER_PAGE,
        }).then((page) => page.items),
      ),
    );

    return [first.items, ...remaining].flat();
  }

  /**
   * Fetches a single page of GET /transactions, normalising the envelope and
   * extracting the pagination page count.
   *
   * @param filters Query-parameter filters (may include `page`/`per_page`).
   * @returns The page's transactions and the total number of pages (>= 1).
   */
  async #fetchTransactionsPage(
    filters?: ListTransactionsFilters,
  ): Promise<{ items: TransactionDto[]; pages: number }> {
    const response = await this.#http.get<TransactionListResponseEnvelope | TransactionDto[]>(
      "/transactions",
      { params: filters },
    );

    const raw = response.data;

    if (Array.isArray(raw)) {
      return { items: raw, pages: 1 };
    }

    const envelope = raw as TransactionListResponseEnvelope;
    const items = envelope.data?.transactions ?? envelope.transactions ?? [];
    const pages = envelope.meta?.pagination?.pages ?? 1;
    return { items, pages };
  }
}

/**
 * Resolves the canonical transactions API client using the shared HTTP layer.
 *
 * @returns TransactionsClient instance bound to the application HTTP adapter.
 */
export const useTransactionsClient = (): TransactionsClient =>
  new TransactionsClient(useHttp());
