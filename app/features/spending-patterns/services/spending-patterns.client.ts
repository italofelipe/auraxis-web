import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { V2EnvelopeDTO } from "~/features/ai-insights/contracts/ai-insight";
import type {
  SpendingPatternTransactionInputDto,
  SpendingPatternsResponseDto,
} from "~/features/spending-patterns/contracts/spending-patterns.dto";
import {
  mapSpendingPatternsResponse,
  type SpendingPattern,
} from "~/features/spending-patterns/model/spending-patterns";

/**
 * Unwraps the v2 envelope, tolerating legacy flat payloads.
 *
 * @param payload Backend response body.
 * @returns The inner payload.
 */
const unwrap = <T>(payload: V2EnvelopeDTO<T> | T): T => {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as V2EnvelopeDTO<T>).data !== undefined
  ) {
    return (payload as V2EnvelopeDTO<T>).data as T;
  }
  return payload as T;
};

const ENDPOINT = "/ai/insights/spending-patterns";

/**
 * HTTP adapter for the spending-patterns radar (premium gateway to v2).
 */
export class SpendingPatternsApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured with auth and API contract headers.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Detects compulsive-spending patterns from the supplied expense transactions.
   *
   * @param transactions LGPD-safe transaction inputs (amount/date/labels only).
   * @param periodDays Analysis window in days.
   * @returns Patterns ordered by descending severity.
   */
  async detect(
    transactions: readonly SpendingPatternTransactionInputDto[],
    periodDays = 90,
  ): Promise<SpendingPattern[]> {
    const response = await this.#http.post<V2EnvelopeDTO<SpendingPatternsResponseDto>>(
      ENDPOINT,
      { transactions, period_days: periodDays },
    );
    return mapSpendingPatternsResponse(unwrap<SpendingPatternsResponseDto>(response.data));
  }
}

/**
 * Factory wiring the client to the default HTTP composable.
 *
 * @returns Ready-to-use client instance.
 */
export const useSpendingPatternsApiClient = (): SpendingPatternsApiClient => {
  return new SpendingPatternsApiClient(useHttp());
};
