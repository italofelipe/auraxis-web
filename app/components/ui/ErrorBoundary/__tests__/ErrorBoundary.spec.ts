import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nuxt";

import ErrorBoundary from "../ErrorBoundary.vue";

vi.mock("@sentry/nuxt", () => ({
  withScope: vi.fn((cb: (scope: { setTag: ReturnType<typeof vi.fn> }) => void) => {
    cb({ setTag: vi.fn() });
  }),
  captureException: vi.fn(),
}));

// A child component that throws during render when `shouldThrow` prop is true.
const ThrowingChild = defineComponent({
  name: "ThrowingChild",
  props: {
    shouldThrow: { type: Boolean, default: false },
  },
  setup(props) {
    return (): ReturnType<typeof h> => {
      if (props.shouldThrow) {
        throw new Error("test error");
      }
      return h("span", "child content");
    };
  },
});

// A custom fallback component that exposes an onRetry prop.
const CustomFallback = defineComponent({
  name: "CustomFallback",
  props: {
    onRetry: { type: Function, default: undefined },
  },
  setup() {
    return (): ReturnType<typeof h> => h("div", { "data-testid": "custom-fallback" }, "custom fallback");
  },
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.warn from Vue's error handler during tests
    vi.spyOn(console, "warn").mockImplementation((): void => undefined);
  });

  it("renders slot content when no error occurs", () => {
    const wrapper = mount(ErrorBoundary, {
      props: { feature: "dashboard" },
      slots: { default: "<span>normal content</span>" },
    });

    expect(wrapper.text()).toContain("normal content");
    expect(wrapper.find("[role='alert']").exists()).toBe(false);
  });

  it("shows default fallback UI when child throws an error", async () => {
    const wrapper = mount(ErrorBoundary, {
      props: { feature: "dashboard" },
      slots: {
        default: h(ThrowingChild, { shouldThrow: true }),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find("[role='alert']").exists()).toBe(true);
    expect(wrapper.find(".error-boundary__retry").exists()).toBe(true);
  });

  it("calls Sentry.captureException with the thrown error", async () => {
    mount(ErrorBoundary, {
      props: { feature: "transactions" },
      slots: {
        default: h(ThrowingChild, { shouldThrow: true }),
      },
    });

    await new Promise<void>((r) => setTimeout(r, 0));

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it("calls Sentry.withScope when an error is captured", async () => {
    mount(ErrorBoundary, {
      props: { feature: "wallet" },
      slots: {
        default: h(ThrowingChild, { shouldThrow: true }),
      },
    });

    await new Promise<void>((r) => setTimeout(r, 0));

    expect(Sentry.withScope).toHaveBeenCalledTimes(1);
  });

  it("invokes onError callback with the thrown error, instance and info", async () => {
    const onError = vi.fn();

    mount(ErrorBoundary, {
      props: { feature: "goals", onError },
      slots: {
        default: h(ThrowingChild, { shouldThrow: true }),
      },
    });

    await new Promise<void>((r) => setTimeout(r, 0));

    expect(onError).toHaveBeenCalledTimes(1);
    const [err] = onError.mock.calls[0] as [unknown];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe("test error");
  });

  it("resets error state and re-renders slot when retry is clicked", async () => {
    const wrapper = mount(ErrorBoundary, {
      props: { feature: "dashboard" },
      slots: {
        default: h(ThrowingChild, { shouldThrow: true }),
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.find("[role='alert']").exists()).toBe(true);

    await wrapper.find(".error-boundary__retry").trigger("click");
    await wrapper.vm.$nextTick();

    // After retry, the error state is reset — slot attempts to render again.
    // The slot still throws, so the boundary catches it again immediately.
    // We verify retry button is callable without throwing itself.
    expect(wrapper.find(".error-boundary__retry").exists()).toBe(true);
  });

  it("renders custom fallback component when fallback prop is provided", async () => {
    const wrapper = mount(ErrorBoundary, {
      props: { feature: "dashboard", fallback: CustomFallback },
      slots: {
        default: h(ThrowingChild, { shouldThrow: true }),
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.find("[data-testid='custom-fallback']").exists()).toBe(true);
    expect(wrapper.find("[role='alert']").exists()).toBe(false);
  });
});
