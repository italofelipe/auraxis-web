import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { useSubscriptionQuery } from "~/features/subscription/queries/use-subscription-query";
import BillingStatusBanner from "../BillingStatusBanner.vue";

// ── Stubs ────────────────────────────────────────────────────────────────────

vi.mock("~/features/subscription/queries/use-subscription-query", () => ({
  useSubscriptionQuery: vi.fn(),
}));

vi.mock("naive-ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NButton: { name: "NButton", template: "<button><slot /></button>", props: ["href", "type"] },
  };
});

const mockSubscriptionQuery = useSubscriptionQuery as ReturnType<typeof vi.fn>;

describe("BillingStatusBanner", () => {
  it("does not render when subscription is active", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "active" } } });
    const wrapper = mount(BillingStatusBanner);
    expect(wrapper.find("[data-testid='billing-status-banner']").exists()).toBe(false);
  });

  it("does not render when there is no subscription", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: null } });
    const wrapper = mount(BillingStatusBanner);
    expect(wrapper.find("[data-testid='billing-status-banner']").exists()).toBe(false);
  });

  it("renders info banner when subscription is trialing", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "trialing" } } });
    const wrapper = mount(BillingStatusBanner);
    const banner = wrapper.find("[data-testid='billing-status-banner']");
    expect(banner.exists()).toBe(true);
    expect(banner.classes()).toContain("billing-banner--info");
  });

  it("trialing banner CTA links to /plans", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "trialing" } } });
    const wrapper = mount(BillingStatusBanner);
    const button = wrapper.findComponent({ name: "NButton" });
    expect(button.props("href")).toBe("/plans");
  });

  it("renders warning banner when subscription is past_due", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "past_due" } } });
    const wrapper = mount(BillingStatusBanner);
    const banner = wrapper.find("[data-testid='billing-status-banner']");
    expect(banner.exists()).toBe(true);
    expect(banner.classes()).toContain("billing-banner--warning");
  });

  it("past_due banner CTA links to /subscription", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "past_due" } } });
    const wrapper = mount(BillingStatusBanner);
    const button = wrapper.findComponent({ name: "NButton" });
    expect(button.props("href")).toBe("/subscription");
  });

  it("renders error banner when subscription is canceled", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "canceled" } } });
    const wrapper = mount(BillingStatusBanner);
    const banner = wrapper.find("[data-testid='billing-status-banner']");
    expect(banner.exists()).toBe(true);
    expect(banner.classes()).toContain("billing-banner--error");
  });

  it("canceled banner CTA links to /subscription", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "canceled" } } });
    const wrapper = mount(BillingStatusBanner);
    const button = wrapper.findComponent({ name: "NButton" });
    expect(button.props("href")).toBe("/subscription");
  });

  it("has correct role attribute for accessibility", () => {
    mockSubscriptionQuery.mockReturnValue({ data: { value: { status: "past_due" } } });
    const wrapper = mount(BillingStatusBanner);
    expect(wrapper.find("[data-testid='billing-status-banner']").attributes("role")).toBe("alert");
  });
});
