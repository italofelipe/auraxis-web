import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  CreateCreditCardPayload,
  CreditCardDto,
  UpdateCreditCardPayload,
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
  async updateCreditCard(id: string, payload: UpdateCreditCardPayload): Promise<CreditCardDto> {
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
}

/**
 * Resolves the canonical credit-cards API client using the shared HTTP layer.
 * @returns CreditCardsClient instance bound to the application HTTP adapter.
 */
export const useCreditCardsClient = (): CreditCardsClient => new CreditCardsClient(useHttp());
