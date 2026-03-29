import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CheckoutButton from "./CheckoutButton.vue";

const createCheckoutMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/subscription/services/subscription.client", () => ({
  useSubscriptionClient: (): { createCheckout: typeof createCheckoutMock } => ({
    createCheckout: createCheckoutMock,
  }),
}));

const stubs = {
  NButton: {
    props: ["type", "loading", "disabled", "block"],
    template:
      "<button class='n-button' :data-loading='loading' :disabled='disabled' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
};

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
      props: { planSlug: "premium" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Assinar");
  });

  it("renders a custom label when provided", () => {
    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "premium", label: "Iniciar trial" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Iniciar trial");
  });

  it("calls createCheckout with planSlug and redirects to checkout_url on success", async () => {
    const checkoutUrl = "https://checkout.stripe.com/session-123";
    createCheckoutMock.mockResolvedValue(checkoutUrl);

    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "premium" },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    await vi.runAllTimersAsync().catch(() => {});

    // Allow microtask queue to flush
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(createCheckoutMock).toHaveBeenCalledWith("premium");
    expect(window.location.href).toBe(checkoutUrl);
  });

  it("shows error message when createCheckout throws", async () => {
    createCheckoutMock.mockRejectedValue(new Error("payment provider unavailable"));

    const wrapper = mount(CheckoutButton, {
      props: { planSlug: "premium" },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain("payment provider unavailable");
  });
});
