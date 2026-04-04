import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CheckoutButton from "./CheckoutButton.vue";

const createCheckoutMock = vi.hoisted(() => vi.fn());
const mockMessageError = vi.hoisted(() => vi.fn());

vi.mock("~/features/subscription/services/subscription.client", () => ({
  useSubscriptionClient: (): { createCheckout: typeof createCheckoutMock } => ({
    createCheckout: createCheckoutMock,
  }),
}));

vi.mock("naive-ui", () => ({
  NButton: {
    props: ["type", "loading", "disabled", "block"],
    template:
      "<button class='n-button' :data-loading='loading' :disabled='disabled' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  useMessage: (): { error: typeof mockMessageError; success: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> } => ({ error: mockMessageError, success: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));

vi.mock("~/composables/useApiError", () => ({
  useApiError: (): { getErrorMessage: (err: unknown) => string } => ({ getErrorMessage: vi.fn((err: unknown): string => (err instanceof Error ? err.message : String(err))) }),
}));

const stubs = {};

describe("CheckoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "" },
    });
  });

  it("renders the default label 'Assinar'", () => {
    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "pro" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Assinar");
  });

  it("renders a custom label when provided", () => {
    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "pro", label: "Iniciar trial" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Iniciar trial");
  });

  it("calls createCheckout with planSlug and monthly cycle by default, then redirects", async () => {
    const checkoutUrl = "https://checkout.stripe.com/session-123";
    createCheckoutMock.mockResolvedValue(checkoutUrl);

    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "pro" },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    await vi.runAllTimersAsync().catch(() => {});

    // Allow microtask queue to flush
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(createCheckoutMock).toHaveBeenCalledWith("pro", "monthly");
    expect(window.location.href).toBe(checkoutUrl);
  });

  it("calls createCheckout with annual billing cycle when prop is set", async () => {
    const checkoutUrl = "https://checkout.stripe.com/session-456";
    createCheckoutMock.mockResolvedValue(checkoutUrl);

    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "pro", billingCycle: "annual" },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(createCheckoutMock).toHaveBeenCalledWith("pro", "annual");
    expect(window.location.href).toBe(checkoutUrl);
  });

  it("shows error toast when createCheckout throws", async () => {
    createCheckoutMock.mockRejectedValue(new Error("payment provider unavailable"));

    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "pro" },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(mockMessageError).toHaveBeenCalledWith("payment provider unavailable");
  });
});
