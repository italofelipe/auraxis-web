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
}

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
   */
  async deleteTransaction(id: string): Promise<void> {
    await this.#http.delete(`/transactions/${id}`);
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
   * Lists the authenticated user's transactions, optionally filtered by
   * type, status and date range.
   *
   * @param filters Optional query-parameter filters.
   * @returns Array of TransactionDto records.
   */
  async listTransactions(filters?: ListTransactionsFilters): Promise<TransactionDto[]> {
    const response = await this.#http.get<TransactionListResponseEnvelope | TransactionDto[]>(
      "/transactions",
      { params: filters },
    );

    const raw = response.data;

    if (Array.isArray(raw)) {
      return raw;
    }

    return (raw as TransactionListResponseEnvelope).data?.transactions
      ?? (raw as TransactionListResponseEnvelope).transactions
      ?? [];
  }
}

/**
 * Resolves the canonical transactions API client using the shared HTTP layer.
 *
 * @returns TransactionsClient instance bound to the application HTTP adapter.
 */
export const useTransactionsClient = (): TransactionsClient =>
  new TransactionsClient(useHttp());
