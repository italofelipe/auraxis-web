import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AxiosInstance } from "axios";

import { SharedEntriesClient } from "./shared-entries.client";
import type {
  SharedEntryDto,
  SharedEntriesListResponseEnvelope,
} from "~/features/shared-entries/contracts/shared-entry.dto";

/**
 * Creates a minimal valid SharedEntryDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete SharedEntryDto fixture.
 */
const makeSharedEntryDto = (overrides: Partial<SharedEntryDto> = {}): SharedEntryDto => ({
  id: "se-test-001",
  owner_id: "user-owner-001",
  transaction_id: "txn-test-001",
  transaction_title: "Jantar de teste",
  transaction_amount: 400,
  my_share: 200,
  other_party_email: "friend@example.com",
  split_type: "equal",
  status: "pending",
  created_at: "2026-03-20T10:00:00Z",
  updated_at: "2026-03-20T10:00:00Z",
  ...overrides,
});

/**
 * Wraps an array of SharedEntryDto fixtures in the backend response envelope.
 *
 * @param entries - Array of SharedEntryDto fixtures.
 * @returns The backend envelope object.
 */
const makeEnvelope = (
  entries: SharedEntryDto[],
): SharedEntriesListResponseEnvelope => ({
  success: true,
  message: "ok",
  data: { shared_entries: entries },
});

describe("SharedEntriesClient", () => {
  let http: AxiosInstance;
  let client: SharedEntriesClient;

  beforeEach(() => {
    http = { get: vi.fn(), delete: vi.fn() } as unknown as AxiosInstance;
    client = new SharedEntriesClient(http);
  });

  // ── getSharedByMe ──────────────────────────────────────────────────────────

  describe("getSharedByMe", () => {
    it("calls GET /shared-entries/by-me", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope([]) });

      await client.getSharedByMe();

      expect(http.get).toHaveBeenCalledWith("/shared-entries/by-me");
    });

    it("unwraps data.shared_entries from the response envelope", async () => {
      const entries = [makeSharedEntryDto(), makeSharedEntryDto({ id: "se-002" })];
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope(entries) });

      const result = await client.getSharedByMe();

      expect(result).toEqual(entries);
    });

    it("returns an empty array when shared_entries is empty", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope([]) });

      const result = await client.getSharedByMe();

      expect(result).toEqual([]);
    });

    it("propagates HTTP errors without catching them", async () => {
      vi.mocked(http.get).mockRejectedValueOnce(new Error("network error"));

      await expect(client.getSharedByMe()).rejects.toThrow("network error");
    });

    it("preserves all enriched fields on each returned entry", async () => {
      const entry = makeSharedEntryDto({
        transaction_title: "Viagem compartilhada",
        transaction_amount: 1200,
        my_share: 400,
        split_type: "custom",
        status: "accepted",
        owner_id: "user-abc",
        updated_at: "2026-03-21T12:00:00Z",
      });
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope([entry]) });

      const results = await client.getSharedByMe();
      const result = results[0];

      expect(result?.transaction_title).toBe("Viagem compartilhada");
      expect(result?.transaction_amount).toBe(1200);
      expect(result?.my_share).toBe(400);
      expect(result?.split_type).toBe("custom");
      expect(result?.status).toBe("accepted");
      expect(result?.owner_id).toBe("user-abc");
      expect(result?.updated_at).toBe("2026-03-21T12:00:00Z");
    });
  });

  // ── getSharedWithMe ────────────────────────────────────────────────────────

  describe("getSharedWithMe", () => {
    it("calls GET /shared-entries/with-me", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope([]) });

      await client.getSharedWithMe();

      expect(http.get).toHaveBeenCalledWith("/shared-entries/with-me");
    });

    it("unwraps data.shared_entries from the response envelope", async () => {
      const entries = [
        makeSharedEntryDto({ id: "se-with-001", other_party_email: "sender@example.com" }),
      ];
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope(entries) });

      const result = await client.getSharedWithMe();

      expect(result).toEqual(entries);
      expect(result[0]?.other_party_email).toBe("sender@example.com");
    });

    it("returns an empty array when shared_entries is empty", async () => {
      vi.mocked(http.get).mockResolvedValueOnce({ data: makeEnvelope([]) });

      const result = await client.getSharedWithMe();

      expect(result).toEqual([]);
    });

    it("propagates HTTP errors without catching them", async () => {
      vi.mocked(http.get).mockRejectedValueOnce(new Error("server error"));

      await expect(client.getSharedWithMe()).rejects.toThrow("server error");
    });
  });

  // ── revokeSharedEntry ──────────────────────────────────────────────────────

  describe("revokeSharedEntry", () => {
    it("calls DELETE /shared-entries/:id", async () => {
      vi.mocked(http.delete).mockResolvedValueOnce({});

      await client.revokeSharedEntry("se-abc-123");

      expect(http.delete).toHaveBeenCalledWith("/shared-entries/se-abc-123");
    });

    it("resolves void on success", async () => {
      vi.mocked(http.delete).mockResolvedValueOnce({});

      await expect(client.revokeSharedEntry("se-001")).resolves.toBeUndefined();
    });

    it("propagates HTTP errors without catching them", async () => {
      vi.mocked(http.delete).mockRejectedValueOnce(new Error("forbidden"));

      await expect(client.revokeSharedEntry("se-001")).rejects.toThrow("forbidden");
    });
  });
});
