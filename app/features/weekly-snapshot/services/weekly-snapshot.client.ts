import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type { V2EnvelopeDTO } from "~/features/ai-insights/contracts/ai-insight";
import type { WeeklySummaryNarrativeDto } from "~/features/weekly-snapshot/contracts/weekly-snapshot.dto";
import {
  mapWeeklySnapshotDto,
  type WeeklySnapshot,
} from "~/features/weekly-snapshot/model/weekly-snapshot";

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

/**
 * HTTP adapter for the premium AI weekly-summary narrative endpoint.
 */
export class WeeklySnapshotApiClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Axios instance configured with auth and API contract headers.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Fetches the weekly snapshot narrative for the authenticated premium user.
   *
   * @returns Weekly snapshot domain model.
   */
  async getWeeklySnapshot(): Promise<WeeklySnapshot> {
    const response = await this.#http.get<V2EnvelopeDTO<WeeklySummaryNarrativeDto>>(
      "/ai/insights/weekly-summary",
    );
    return mapWeeklySnapshotDto(unwrap<WeeklySummaryNarrativeDto>(response.data));
  }
}

/**
 * Factory wiring the weekly-snapshot client to the default HTTP composable.
 *
 * @returns Ready-to-use client instance.
 */
export const useWeeklySnapshotApiClient = (): WeeklySnapshotApiClient => {
  return new WeeklySnapshotApiClient(useHttp());
};
