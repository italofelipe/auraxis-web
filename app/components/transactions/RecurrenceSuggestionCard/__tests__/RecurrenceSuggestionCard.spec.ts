import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import RecurrenceSuggestionCard from "../RecurrenceSuggestionCard.vue";
import type { RecurrencePattern } from "~/features/transactions/composables/useRecurrenceDetection";

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Builds a RecurrencePattern with sensible defaults, merging optional overrides.
 *
 * @param overrides - Fields to override from defaults.
 * @returns RecurrencePattern instance.
 */
const makePattern = (overrides: Partial<RecurrencePattern> = {}): RecurrencePattern => ({
  groupKey: "tag:tag-streaming",
  label: "Netflix",
  medianAmount: 39.9,
  transactionIds: ["id-1", "id-2", "id-3", "id-4", "id-5", "id-6"],
  confidence: "high",
  annualImpact: 478.8,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RecurrenceSuggestionCard", () => {
  it("renders the transaction label", () => {
    const wrapper = mount(RecurrenceSuggestionCard, {
      props: { pattern: makePattern() },
    });
    expect(wrapper.text()).toContain("Netflix");
  });

  it("displays the confidence badge with correct class for high", () => {
    const wrapper = mount(RecurrenceSuggestionCard, {
      props: { pattern: makePattern({ confidence: "high" }) },
    });
    const badge = wrapper.find(".rsc__badge--high");
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toContain("Alta");
  });

  it("displays the confidence badge with correct class for medium", () => {
    const wrapper = mount(RecurrenceSuggestionCard, {
      props: { pattern: makePattern({ confidence: "medium" }) },
    });
    expect(wrapper.find(".rsc__badge--medium").exists()).toBe(true);
    expect(wrapper.text()).toContain("Média");
  });

  it("displays the confidence badge with correct class for low", () => {
    const wrapper = mount(RecurrenceSuggestionCard, {
      props: { pattern: makePattern({ confidence: "low" }) },
    });
    expect(wrapper.find(".rsc__badge--low").exists()).toBe(true);
    expect(wrapper.text()).toContain("Baixa");
  });

  it("shows the annual impact projection", () => {
    const wrapper = mount(RecurrenceSuggestionCard, {
      props: { pattern: makePattern({ annualImpact: 478.8 }) },
    });
    // The formatted value contains the number; exact format depends on locale.
    expect(wrapper.find(".rsc__projection").text()).toContain("478");
  });

  it("emits 'confirm' with the pattern when confirm button is clicked", async () => {
    const pattern = makePattern();
    const wrapper = mount(RecurrenceSuggestionCard, { props: { pattern } });

    await wrapper.find(".rsc__btn--primary").trigger("click");

    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("confirm")?.[0]).toEqual([pattern]);
  });

  it("emits 'dismiss' with the groupKey when dismiss button is clicked", async () => {
    const pattern = makePattern({ groupKey: "tag:abc" });
    const wrapper = mount(RecurrenceSuggestionCard, { props: { pattern } });

    await wrapper.find(".rsc__btn--ghost").trigger("click");

    expect(wrapper.emitted("dismiss")).toHaveLength(1);
    expect(wrapper.emitted("dismiss")?.[0]).toEqual(["tag:abc"]);
  });

  it("emits 'never' with the groupKey when never button is clicked", async () => {
    const pattern = makePattern({ groupKey: "title:netflix" });
    const wrapper = mount(RecurrenceSuggestionCard, { props: { pattern } });

    await wrapper.find(".rsc__btn--muted").trigger("click");

    expect(wrapper.emitted("never")).toHaveLength(1);
    expect(wrapper.emitted("never")?.[0]).toEqual(["title:netflix"]);
  });

  it("has accessible role status and aria-label", () => {
    const wrapper = mount(RecurrenceSuggestionCard, {
      props: { pattern: makePattern() },
    });
    const root = wrapper.find(".rsc");
    expect(root.attributes("role")).toBe("status");
    expect(root.attributes("aria-label")).toBeTruthy();
  });
});
