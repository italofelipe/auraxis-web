import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AccountDto,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "~/features/accounts/contracts/account.dto";

/**
 * API client for the accounts feature.
 *
 * Encapsulates all HTTP calls to the `/accounts` endpoints.
 */
export class AccountsClient {
  readonly #http: AxiosInstance;

  /**
   *
   * @param http
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the list of accounts for the authenticated user.
   * @returns Array of AccountDto objects.
   */
  async listAccounts(): Promise<AccountDto[]> {
    const response = await this.#http.get<{ data: { accounts: AccountDto[] } }>("/accounts");
    return response.data.data?.accounts ?? (response.data as unknown as AccountDto[]);
  }

  /**
   * Creates a new account.
   * @param payload - Account creation payload.
   * @returns The created AccountDto.
   */
  async createAccount(payload: CreateAccountPayload): Promise<AccountDto> {
    const response = await this.#http.post<{ data: { account: AccountDto } }>(
      "/accounts",
      payload,
    );
    return response.data.data.account;
  }

  /**
   * Updates an existing account by id.
   * @param id - Account UUID.
   * @param payload - Update payload.
   * @returns The updated AccountDto.
   */
  async updateAccount(id: string, payload: UpdateAccountPayload): Promise<AccountDto> {
    const response = await this.#http.put<{ data: { account: AccountDto } }>(
      `/accounts/${id}`,
      payload,
    );
    return response.data.data.account;
  }

  /**
   * Deletes an account by id.
   * @param id
   */
  async deleteAccount(id: string): Promise<void> {
    await this.#http.delete(`/accounts/${id}`);
  }
}

/**
 * Resolves the canonical accounts API client using the shared HTTP layer.
 * @returns AccountsClient instance bound to the application HTTP adapter.
 */
export const useAccountsClient = (): AccountsClient => new AccountsClient(useHttp());
