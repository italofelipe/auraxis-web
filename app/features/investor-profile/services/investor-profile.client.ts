import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  QuestionnaireDto,
  QuestionnaireResultDto,
  SubmitAnswersPayload,
} from "~/features/investor-profile/contracts/investor-profile.dto";

/**
 * API client for the investor-profile feature.
 *
 * Encapsulates all HTTP calls to the `/user/profile/questionnaire` endpoints
 * and returns mapped DTO types ready for UI consumption.
 */
export class InvestorProfileClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the investor profile questionnaire for the authenticated user.
   *
   * Calls `GET /user/profile/questionnaire` and unwraps the response envelope.
   *
   * @returns QuestionnaireDto with the list of questions and their options.
   */
  async getQuestionnaire(): Promise<QuestionnaireDto> {
    const response = await this.#http.get<{ data: QuestionnaireDto }>(
      "/user/profile/questionnaire",
    );
    return response.data.data;
  }

  /**
   * Submits the answers to the investor profile questionnaire.
   *
   * Calls `POST /user/profile/questionnaire` and returns the scoring result.
   *
   * @param payload - Array of selected option point values in question order.
   * @returns QuestionnaireResultDto with the suggested profile and score.
   */
  async submitAnswers(payload: SubmitAnswersPayload): Promise<QuestionnaireResultDto> {
    const response = await this.#http.post<{ data: QuestionnaireResultDto }>(
      "/user/profile/questionnaire",
      payload,
    );
    return response.data.data;
  }
}

/**
 * Resolves the canonical investor-profile API client using the shared HTTP layer.
 *
 * @returns InvestorProfileClient instance bound to the application HTTP adapter.
 */
export const useInvestorProfileClient = (): InvestorProfileClient => {
  return new InvestorProfileClient(useHttp());
};
