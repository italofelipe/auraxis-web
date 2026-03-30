import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  CreateTransactionPayload,
  TransactionDto,
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
}

/**
 * Resolves the canonical transactions API client using the shared HTTP layer.
 *
 * @returns TransactionsClient instance bound to the application HTTP adapter.
 */
export const useTransactionsClient = (): TransactionsClient =>
  new TransactionsClient(useHttp());
