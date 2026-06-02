import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import {
  toCreditCardBill,
  toCreditCardUtilization,
  type CreateCreditCardPayload,
  type CreditCardBill,
  type CreditCardDto,
  type CreditCardUtilization,
} from "~/features/credit-cards/contracts/credit-card.dto";

/**
 * API client for the credit-cards feature.
 *
 * Encapsulates all HTTP calls to the `/credit-cards` endpoints.
 */
export class CreditCardsClient {
  readonly #http: AxiosInstance;

  /**
   *
   * @param http
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the list of credit cards for the authenticated user.
   * @returns Array of CreditCardDto objects.
   */
  async listCreditCards(): Promise<CreditCardDto[]> {
    const response = await this.#http.get<{ data: { credit_cards: CreditCardDto[] } }>(
      "/credit-cards",
    );
    return response.data.data?.credit_cards ?? (response.data as unknown as CreditCardDto[]);
  }

  /**
   * Creates a new credit card.
   * @param payload - Credit card creation payload.
   * @returns The created CreditCardDto.
   */
  async createCreditCard(payload: CreateCreditCardPayload): Promise<CreditCardDto> {
    const response = await this.#http.post<{ data: { credit_card: CreditCardDto } }>(
      "/credit-cards",
      payload,
    );
    return response.data.data.credit_card;
  }

  /**
   * Updates an existing credit card by id.
   * @param id - Credit card UUID.
   * @param payload - Update payload.
   * @returns The updated CreditCardDto.
   */
  async updateCreditCard(id: string, payload: CreateCreditCardPayload): Promise<CreditCardDto> {
    const response = await this.#http.put<{ data: { credit_card: CreditCardDto } }>(
      `/credit-cards/${id}`,
      payload,
    );
    return response.data.data.credit_card;
  }

  /**
   * Deletes a credit card by id.
   * @param id
   */
  async deleteCreditCard(id: string): Promise<void> {
    await this.#http.delete(`/credit-cards/${id}`);
  }

  /**
   * Fetches the bill (cycle + transactions + totals) for a given month.
   *
   * @param id - Credit card UUID.
   * @param month - Optional YYYY-MM; backend defaults to the current month.
   * @returns Bill view-model with monetary values coerced to numbers.
   */
  async getBill(id: string, month?: string): Promise<CreditCardBill> {
    const response = await this.#http.get(`/credit-cards/${id}/bill`, {
      params: month ? { month } : undefined,
    });
    return toCreditCardBill(response.data);
  }

  /**
   * Fetches the current-cycle utilization for a credit card.
   *
   * @param id - Credit card UUID.
   * @returns Utilization view-model with amounts coerced to numbers.
   */
  async getUtilization(id: string): Promise<CreditCardUtilization> {
    const response = await this.#http.get(`/credit-cards/${id}/utilization`);
    return toCreditCardUtilization(response.data);
  }
}

/**
 * Resolves the canonical credit-cards API client using the shared HTTP layer.
 * @returns CreditCardsClient instance bound to the application HTTP adapter.
 */
export const useCreditCardsClient = (): CreditCardsClient => new CreditCardsClient(useHttp());
