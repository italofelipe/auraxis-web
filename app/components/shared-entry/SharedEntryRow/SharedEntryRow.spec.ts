import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NButton } from "naive-ui";

import SharedEntryRow from "./SharedEntryRow.vue";
import type { SharedEntryDto } from "../../contracts/shared-entry.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid SharedEntryDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete SharedEntryDto fixture.
 */
const makeEntry = (overrides: Partial<SharedEntryDto> = {}): SharedEntryDto => ({
  id: "se-test-001",
  transaction_id: "txn-test",
  transaction_title: "Jantar de teste",
  transaction_amount: 400,
  split_type: "equal",
  my_share: 200,
  other_party_email: "test@example.com",
  created_at: "2026-03-20T10:00:00Z",
  status: "pending",
  ...overrides,
});

/**
 * Mounts SharedEntryRow with real Naive UI rendering.
 *
 * @param entry - Shared entry data to render.
 * @param mode - View mode: "by-me" or "with-me".
 * @returns VueWrapper around the mounted component.
 */
function mountRow(
  entry: SharedEntryDto,
  mode: "by-me" | "with-me" = "by-me",
): ReturnType<typeof mount> {
  return mount(SharedEntryRow, { props: { entry, mode } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SharedEntryRow", () => {
  it("renders the transaction title", () => {
    const wrapper = mountRow(makeEntry({ transaction_title: "Aluguel de temporada" }));
    expect(wrapper.text()).toContain("Aluguel de temporada");
  });

  it("renders the status tag with type='warning' for pending", () => {
    const wrapper = mountRow(makeEntry({ status: "pending" }));
    const tags = wrapper.findAllComponents(NTag);
    const statusTag = tags.find((t) => t.props("type") === "warning");
    expect(statusTag).toBeDefined();
  });

  it("renders the status tag with type='success' for accepted", () => {
    const wrapper = mountRow(makeEntry({ status: "accepted" }));
    const tags = wrapper.findAllComponents(NTag);
    const statusTag = tags.find((t) => t.props("type") === "success");
    expect(statusTag).toBeDefined();
  });

  it("renders the status tag with type='error' for declined", () => {
    const wrapper = mountRow(makeEntry({ status: "declined" }));
    const tags = wrapper.findAllComponents(NTag);
    const statusTag = tags.find((t) => t.props("type") === "error");
    expect(statusTag).toBeDefined();
  });

  it("shows the revoke button only in by-me mode with pending status", () => {
    const wrapper = mountRow(makeEntry({ status: "pending" }), "by-me");
    expect(wrapper.findComponent(NButton).exists()).toBe(true);
    expect(wrapper.text()).toContain("Revogar");
  });

  it("does not show revoke button in with-me mode even when pending", () => {
    const wrapper = mountRow(makeEntry({ status: "pending" }), "with-me");
    expect(wrapper.findComponent(NButton).exists()).toBe(false);
  });

  it("does not show revoke button in by-me mode when status is accepted", () => {
    const wrapper = mountRow(makeEntry({ status: "accepted" }), "by-me");
    expect(wrapper.findComponent(NButton).exists()).toBe(false);
  });

  it("emits 'revoke' with entry id when revoke button is clicked", async () => {
    const entry = makeEntry({ id: "se-revoke-01", status: "pending" });
    const wrapper = mountRow(entry, "by-me");
    await wrapper.findComponent(NButton).trigger("click");
    expect(wrapper.emitted("revoke")).toBeTruthy();
    expect(wrapper.emitted("revoke")![0]).toEqual(["se-revoke-01"]);
  });

  it("renders the split_type tag for equal", () => {
    const wrapper = mountRow(makeEntry({ split_type: "equal" }));
    const tags = wrapper.findAllComponents(NTag);
    const splitTag = tags.find((t) => t.props("type") === "default");
    expect(splitTag).toBeDefined();
    expect(wrapper.text()).toContain("Igual");
  });

  it("renders the split_type tag for custom", () => {
    const wrapper = mountRow(makeEntry({ split_type: "custom" }));
    const tags = wrapper.findAllComponents(NTag);
    const splitTag = tags.find((t) => t.props("type") === "info");
    expect(splitTag).toBeDefined();
    expect(wrapper.text()).toContain("Personalizado");
  });

  it("renders formatted amounts with BRL currency", () => {
    const wrapper = mountRow(makeEntry({ my_share: 200, transaction_amount: 400 }));
    expect(wrapper.text()).toContain("R$");
    expect(wrapper.text()).toContain("200");
    expect(wrapper.text()).toContain("400");
  });

  it("renders the other party email", () => {
    const wrapper = mountRow(makeEntry({ other_party_email: "friend@mail.com" }));
    expect(wrapper.text()).toContain("friend@mail.com");
  });
});
