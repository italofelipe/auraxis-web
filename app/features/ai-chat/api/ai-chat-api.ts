import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  AIChatRequestDTO,
  AIChatResponseDTO,
  V2EnvelopeDTO,
} from "~/features/ai-chat/contracts/ai-chat";

/**
 * Extracts the typed payload from a v2 envelope while tolerating legacy flat
 * payloads used in older mocks.
 *
 * @param payload Backend response body.
 * @returns Unwrapped payload.
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

/**
 * HTTP adapter for the "Ask Anything" AI chat endpoint.
 */
export class AiChatApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured with auth and API contract headers.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Asks a snapshot-grounded finance question via `POST /ai/chat`.
   *
   * @param question Natural-language question about the user's finances.
   * @returns The grounded answer plus model/usage metadata.
   */
  async askFinancialQuestion(question: string): Promise<AIChatResponseDTO> {
    const payload: AIChatRequestDTO = { question };
    const response = await this.#http.post<V2EnvelopeDTO<AIChatResponseDTO>>("/ai/chat", payload);

    return unwrap<AIChatResponseDTO>(response.data);
  }
}

/**
 * Resolves the AI chat API client using the shared HTTP adapter.
 *
 * @returns AI chat API client.
 */
export const useAiChatApiClient = (): AiChatApiClient => {
  return new AiChatApiClient(useHttp());
};
