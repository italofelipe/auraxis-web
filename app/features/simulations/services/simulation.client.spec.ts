import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";

import { SimulationClient } from "./simulation.client";
import type {
  SimulationDto,
  SaveSimulationRequestDto,
} from "~/features/simulations/contracts/simulation.dto";
import type { SaveSimulationPayload } from "~/features/simulations/model/simulation";

const dto: SimulationDto = {
  id: "sim-1",
  user_id: "user-1",
  tool_id: "compound-interest",
  rule_version: "2026.04",
  inputs: { initial: 1000 },
  result: { final: 1500 },
  metadata: { label: "Cenário 1" },
  saved: true,
  created_at: "2026-04-29T00:00:00.000Z",
};

/**
 * Wraps a payload in the v2 ApiEnvelope shape used by the API.
 * @param data Inner payload to surface under `data`.
 * @param meta Optional pagination meta block.
 * @returns Axios-shaped response with the v2 envelope wrapper.
 */
const envelope = <T,>(data: T, meta?: Record<string, unknown>): { data: { success: true; data: T; message: string; meta?: Record<string, unknown> } } => ({
  data: { success: true, data, message: "ok", ...(meta !== undefined && { meta }) },
});

/**
 * Builds a fresh SimulationClient with mocked HTTP for each test.
 * @returns Tuple containing the SimulationClient and the mocked http handle.
 */
const buildClient = (): {
  client: SimulationClient;
  http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
} => {
  const http = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  };
  return { client: new SimulationClient(http as unknown as AxiosInstance), http };
};

describe("SimulationClient", () => {
  describe("saveSimulation", () => {
    it("sends the canonical body and unwraps the v2 envelope", async () => {
      const { client, http } = buildClient();
      http.post.mockResolvedValueOnce(envelope({ simulation: dto }));

      const payload: SaveSimulationPayload = {
        toolId: "compound-interest",
        ruleVersion: "2026.04",
        inputs: { initial: 1000 },
        result: { final: 1500 },
        metadata: { label: "Cenário 1" },
      };
      const result = await client.saveSimulation(payload);

      const sent = http.post.mock.calls[0]?.[1] as SaveSimulationRequestDto;
      expect(sent).toEqual({
        tool_id: "compound-interest",
        rule_version: "2026.04",
        inputs: { initial: 1000 },
        result: { final: 1500 },
        metadata: { label: "Cenário 1" },
      });
      expect(result.id).toBe("sim-1");
      expect(result.toolId).toBe("compound-interest");
    });

    it("omits metadata from the body when not provided", async () => {
      const { client, http } = buildClient();
      http.post.mockResolvedValueOnce(envelope({ simulation: dto }));

      await client.saveSimulation({
        toolId: "compound-interest",
        ruleVersion: "2026.04",
        inputs: {},
        result: {},
      });

      const sent = http.post.mock.calls[0]?.[1] as SaveSimulationRequestDto;
      expect(sent).not.toHaveProperty("metadata");
    });
  });

  describe("listSimulations", () => {
    it("translates camelCase params to snake_case query string", async () => {
      const { client, http } = buildClient();
      http.get.mockResolvedValueOnce(
        envelope(
          { items: [dto] },
          { pagination: { page: 2, per_page: 5, total: 12, pages: 3 } },
        ),
      );

      const list = await client.listSimulations({
        page: 2,
        perPage: 5,
        toolId: "compound-interest",
      });

      const params = http.get.mock.calls[0]?.[1] as { params: Record<string, unknown> };
      expect(params.params).toEqual({ page: 2, per_page: 5, tool_id: "compound-interest" });
      expect(list.total).toBe(12);
      expect(list.pages).toBe(3);
      expect(list.items).toHaveLength(1);
    });

    it("falls back to sensible defaults when meta.pagination is missing", async () => {
      const { client, http } = buildClient();
      http.get.mockResolvedValueOnce(envelope({ items: [dto] }));

      const list = await client.listSimulations();

      expect(list.total).toBe(1);
      expect(list.page).toBe(1);
      expect(list.perPage).toBe(1);
      expect(list.pages).toBe(1);
    });
  });

  describe("getSimulation", () => {
    it("hits /simulations/<id> and unwraps the envelope", async () => {
      const { client, http } = buildClient();
      http.get.mockResolvedValueOnce(envelope({ simulation: dto }));

      const result = await client.getSimulation("sim-1");

      expect(http.get).toHaveBeenCalledWith("/simulations/sim-1");
      expect(result.id).toBe("sim-1");
    });
  });

  describe("deleteSimulation", () => {
    it("hits DELETE /simulations/<id>", async () => {
      const { client, http } = buildClient();
      http.delete.mockResolvedValueOnce({ data: undefined });

      await client.deleteSimulation("sim-1");

      expect(http.delete).toHaveBeenCalledWith("/simulations/sim-1");
    });
  });
});
