import type { AxiosInstance } from "axios";

import { useHttp } from "~/composables/useHttp";
import type {
  SaveSimulationRequestDto,
  SimulationDto,
} from "~/features/simulations/contracts/simulation.dto";
import { mapSimulationDto } from "~/features/simulations/services/simulation.mapper";
import type {
  ListSimulationsParams,
  SaveSimulationPayload,
  Simulation,
  SimulationList,
} from "~/features/simulations/model/simulation";

interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly message?: string;
  readonly data: T;
  readonly meta?: Record<string, unknown>;
}

interface SimulationEnvelope {
  readonly simulation: SimulationDto;
}

interface SimulationsEnvelope {
  readonly items: readonly SimulationDto[];
}

interface ListPaginationMeta {
  readonly pagination?: {
    readonly page: number;
    readonly per_page: number;
    readonly total: number;
    readonly pages: number;
  };
}

/**
 * Translates the camelCase domain payload into the snake_case body the API
 * expects (DEC-196).
 * @param payload Domain-side payload built by the calling tool page.
 * @returns Snake_case request DTO ready for transport.
 */
const buildSavePayload = (
  payload: SaveSimulationPayload,
): SaveSimulationRequestDto => ({
  tool_id: payload.toolId,
  rule_version: payload.ruleVersion,
  inputs: payload.inputs,
  result: payload.result,
  ...(payload.metadata !== undefined && { metadata: payload.metadata }),
});

/**
 * Converts the domain list params into the snake_case query string the API
 * accepts (page, per_page, tool_id).
 * @param params Optional list-filter inputs from the caller.
 * @returns Plain object suitable for axios `params`.
 */
const toListParams = (
  params: ListSimulationsParams | undefined,
): Record<string, string | number> => {
  if (!params) {
    return {};
  }
  const out: Record<string, string | number> = {};
  if (params.page !== undefined) {
    out.page = params.page;
  }
  if (params.perPage !== undefined) {
    out.per_page = params.perPage;
  }
  if (params.toolId) {
    out.tool_id = params.toolId;
  }
  return out;
};

interface ResolvedPagination {
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  readonly pages: number;
}

/**
 * Resolves pagination defaults when the API response does not carry an
 * explicit pagination meta block.
 * @param itemCount Number of items returned in this page.
 * @param meta      Raw pagination meta from the v2 envelope.
 * @param requested Optional caller-supplied params.
 * @returns Concrete pagination values for the domain model.
 */
/**
 * Returns the first non-undefined argument, or `undefined` when none match.
 * @param candidates Sequence of optional values to fall back through.
 * @returns The first defined value, or `undefined`.
 */
const pickFirst = <T>(
  ...candidates: ReadonlyArray<T | undefined>
): T | undefined => candidates.find((value) => value !== undefined);

/**
 * Resolves pagination defaults when the API response does not include an
 * explicit pagination meta block.
 * @param itemCount Number of items in the current page response.
 * @param meta      Optional pagination meta from the v2 envelope.
 * @param requested Optional caller-supplied params.
 * @returns Concrete pagination values for the domain model.
 */
const resolvePagination = (
  itemCount: number,
  meta: ListPaginationMeta["pagination"] | undefined,
  requested: ListSimulationsParams | undefined,
): ResolvedPagination => {
  const page = pickFirst(meta?.page, requested?.page) ?? 1;
  const perPage = pickFirst(meta?.per_page, requested?.perPage) ?? itemCount;
  const total = meta?.total ?? itemCount;
  const pages = meta?.pages ?? 1;
  return { page, perPage, total, pages };
};

/**
 * Canonical client for `/simulations` (DEC-196).
 *
 * The backend returns the v2 envelope `{success, data, message, meta?}`
 * because `X-API-Contract: v2` is set globally on the HTTP client. The
 * client unwraps it once here so consumers see typed domain models.
 */
export class SimulationClient {
  readonly #http: AxiosInstance;

  /**
   * @param http Pre-configured Auraxis Axios instance from the core HTTP layer.
   */
  constructor(http: AxiosInstance) {
    this.#http = http;
  }

  /**
   * Persists a simulation produced by any tool in the canonical registry.
   * @param payload Domain-side simulation payload (camelCase fields).
   * @returns The saved simulation as a domain model.
   */
  async saveSimulation(payload: SaveSimulationPayload): Promise<Simulation> {
    const body = buildSavePayload(payload);
    const response = await this.#http.post<ApiEnvelope<SimulationEnvelope>>(
      "/simulations",
      body,
    );
    return mapSimulationDto(response.data.data.simulation);
  }

  /**
   * Lists simulations owned by the authenticated user with optional filters.
   * @param params Optional pagination + tool filter.
   * @returns Paginated list of simulations as domain models.
   */
  async listSimulations(
    params?: ListSimulationsParams,
  ): Promise<SimulationList> {
    const response = await this.#http.get<
      ApiEnvelope<SimulationsEnvelope> & { meta?: ListPaginationMeta }
    >("/simulations", { params: toListParams(params) });
    const items = response.data.data.items.map(mapSimulationDto);
    return {
      items,
      ...resolvePagination(items.length, response.data.meta?.pagination, params),
    };
  }

  /**
   * Fetches a single simulation owned by the authenticated user.
   * @param id UUID of the simulation.
   * @returns The simulation as a domain model.
   */
  async getSimulation(id: string): Promise<Simulation> {
    const response = await this.#http.get<ApiEnvelope<SimulationEnvelope>>(
      `/simulations/${id}`,
    );
    return mapSimulationDto(response.data.data.simulation);
  }

  /**
   * Deletes a simulation owned by the authenticated user.
   * @param id UUID of the simulation to remove.
   */
  async deleteSimulation(id: string): Promise<void> {
    await this.#http.delete(`/simulations/${id}`);
  }
}

/**
 * Convenience hook that resolves the canonical simulation client from the
 * shared HTTP composable.
 * @returns A new {@link SimulationClient} bound to the application HTTP layer.
 */
export const useSimulationClient = (): SimulationClient => {
  return new SimulationClient(useHttp());
};
