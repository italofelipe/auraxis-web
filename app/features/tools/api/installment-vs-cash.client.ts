import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  CreateGoalFromInstallmentVsCashDto,
  CreateGoalFromInstallmentVsCashResponseDto,
  CreatePlannedExpenseFromInstallmentVsCashDto,
  CreatePlannedExpenseFromInstallmentVsCashResponseDto,
  InstallmentVsCashCalculationRequestDto,
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashSaveRequestDto,
  InstallmentVsCashSaveResponseDto,
} from "~/features/tools/contracts/installment-vs-cash.dto";
import {
  mapInstallmentVsCashCalculationDto,
  mapInstallmentVsCashGoalBridgeResponseDto,
  mapInstallmentVsCashPlannedExpenseBridgeResponseDto,
  mapInstallmentVsCashSaveResponseDto,
} from "~/features/tools/api/installment-vs-cash.mapper";
import type {
  CreateInstallmentVsCashGoalPayload,
  CreateInstallmentVsCashPlannedExpensePayload,
  InstallmentVsCashCalculation,
  InstallmentVsCashGoalBridgeResponse,
  InstallmentVsCashPlannedExpenseBridgeResponse,
  InstallmentVsCashSavedCalculation,
} from "~/features/tools/model/installment-vs-cash";

/**
 * API client encapsulating the installment-vs-cash feature contract.
 */
export class InstallmentVsCashClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance already configured for the Auraxis API.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Calls the public calculate endpoint.
   *
   * @param payload Request body for the simulation.
   * @returns Domain calculation object.
   */
  async calculate(
    payload: InstallmentVsCashCalculationRequestDto,
  ): Promise<InstallmentVsCashCalculation> {
    const response = await this.#http.post<InstallmentVsCashCalculationResponseDto>(
      "/simulations/installment-vs-cash/calculate",
      payload,
    );
    return mapInstallmentVsCashCalculationDto(response.data);
  }

  /**
   * Saves a calculation for the authenticated user.
   *
   * @param payload Request body for the save endpoint.
   * @returns Domain bundle with simulation and calculation.
   */
  async save(
    payload: InstallmentVsCashSaveRequestDto,
  ): Promise<InstallmentVsCashSavedCalculation> {
    const response = await this.#http.post<InstallmentVsCashSaveResponseDto>(
      "/simulations/installment-vs-cash/save",
      payload,
    );
    return mapInstallmentVsCashSaveResponseDto(response.data);
  }

  /**
   * Creates a goal from a saved simulation.
   *
   * @param simulationId Saved simulation id.
   * @param payload Goal-creation request payload.
   * @returns Goal bridge response.
   */
  async createGoalFromSimulation(
    simulationId: string,
    payload: CreateInstallmentVsCashGoalPayload,
  ): Promise<InstallmentVsCashGoalBridgeResponse> {
    const body: CreateGoalFromInstallmentVsCashDto = {
      title: payload.title,
      selected_option: payload.selectedOption,
      description: payload.description,
      category: payload.category,
      target_date: payload.targetDate,
      priority: payload.priority,
      current_amount: payload.currentAmount !== undefined
        ? payload.currentAmount.toFixed(2)
        : undefined,
    };

    const response =
      await this.#http.post<CreateGoalFromInstallmentVsCashResponseDto>(
        `/simulations/${simulationId}/goal`,
        body,
      );
    return mapInstallmentVsCashGoalBridgeResponseDto(response.data);
  }

  /**
   * Creates planned expenses from a saved simulation.
   *
   * @param simulationId Saved simulation id.
   * @param payload Planned-expense request payload.
   * @returns Planned-expense bridge response.
   */
  async createPlannedExpenseFromSimulation(
    simulationId: string,
    payload: CreateInstallmentVsCashPlannedExpensePayload,
  ): Promise<InstallmentVsCashPlannedExpenseBridgeResponse> {
    const body: CreatePlannedExpenseFromInstallmentVsCashDto = {
      title: payload.title,
      selected_option: payload.selectedOption,
      description: payload.description,
      observation: payload.observation,
      due_date: payload.dueDate,
      first_due_date: payload.firstDueDate,
      upfront_due_date: payload.upfrontDueDate,
      tag_id: payload.tagId,
      account_id: payload.accountId,
      credit_card_id: payload.creditCardId,
      currency: payload.currency ?? "BRL",
      status: payload.status ?? "pending",
    };

    const response =
      await this.#http.post<CreatePlannedExpenseFromInstallmentVsCashResponseDto>(
        `/simulations/${simulationId}/planned-expense`,
        body,
      );
    return mapInstallmentVsCashPlannedExpenseBridgeResponseDto(response.data);
  }
}

/**
 * Resolves the canonical feature client using the shared HTTP layer.
 *
 * @returns InstallmentVsCashClient bound to the shared HTTP adapter.
 */
export const useInstallmentVsCashClient = (): InstallmentVsCashClient => {
  return new InstallmentVsCashClient(useHttp());
};
