import { describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { ref } from "vue";
import WalletHistoryChart from "../WalletHistoryChart.vue";
import type { WalletHistoryPoint } from "~/features/wallet/services/wallet.client";

// Stub UiChart so ECharts does not need DOM/canvas in unit tests
vi.mock("~/components/ui/UiChart.vue", () => ({
  default: {
    name: "UiChart",
    props: ["option", "height"],
    template: "<div class=\"stub-ui-chart\" />",
  },
}));

// Stub BaseSkeleton
vi.mock("~/components/ui/BaseSkeleton.vue", () => ({
  default: {
    name: "BaseSkeleton",
    template: "<div class=\"stub-base-skeleton\" />",
  },
}));

const useWalletHistoryQueryMock = vi.hoisted(() => vi.fn());

vi.mock("~/features/wallet/queries/use-wallet-history-query", () => ({
  useWalletHistoryQuery: useWalletHistoryQueryMock,
}));

/**
 * Builds a minimal WalletHistoryPoint fixture.
 *
 * @param date - ISO date string.
 * @returns WalletHistoryPoint fixture.
 */
const makePoint = (date: string): WalletHistoryPoint => ({
  date,
  total_value: 1200,
  invested_amount: 1000,
});

/**
 * Mounts WalletHistoryChart with common global stubs.
 *
 * @param props - Component props to pass.
 * @param props.entryId - Wallet entry UUID or null.
 * @param props.entryName - Optional display name for the entry.
 * @returns Mounted VueWrapper instance.
 */
const mountChart = (props: { entryId: string | null; entryName?: string }): VueWrapper =>
  mount(WalletHistoryChart, {
    props,
    global: {
      stubs: {
        ClientOnly: { template: "<slot />" },
      },
    },
  });

describe("WalletHistoryChart", () => {
  it("shows BaseSkeleton while loading", (): void => {
    useWalletHistoryQueryMock.mockReturnValue({
      data: ref(undefined),
      isLoading: ref(true),
      isError: ref(false),
    });

    const wrapper = mountChart({ entryId: "entry-1" });
    expect(wrapper.find(".stub-base-skeleton").exists()).toBe(true);
    expect(wrapper.find(".stub-ui-chart").exists()).toBe(false);
  });

  it("shows unavailable message when there is no data", (): void => {
    useWalletHistoryQueryMock.mockReturnValue({
      data: ref([]),
      isLoading: ref(false),
      isError: ref(false),
    });

    const wrapper = mountChart({ entryId: "entry-1" });
    expect(wrapper.text()).toContain("não disponível");
    expect(wrapper.find(".stub-ui-chart").exists()).toBe(false);
  });

  it("shows unavailable message on query error", (): void => {
    useWalletHistoryQueryMock.mockReturnValue({
      data: ref(undefined),
      isLoading: ref(false),
      isError: ref(true),
    });

    const wrapper = mountChart({ entryId: "entry-1" });
    expect(wrapper.text()).toContain("não disponível");
  });

  it("renders UiChart when data is present", (): void => {
    useWalletHistoryQueryMock.mockReturnValue({
      data: ref([makePoint("2026-01-01"), makePoint("2026-01-02")]),
      isLoading: ref(false),
      isError: ref(false),
    });

    const wrapper = mountChart({ entryId: "entry-1" });
    expect(wrapper.find(".stub-ui-chart").exists()).toBe(true);
  });

  it("renders the entry name as title when provided", (): void => {
    useWalletHistoryQueryMock.mockReturnValue({
      data: ref([makePoint("2026-01-01")]),
      isLoading: ref(false),
      isError: ref(false),
    });

    const wrapper = mountChart({ entryId: "entry-1", entryName: "Petrobras" });
    expect(wrapper.text()).toContain("Petrobras");
  });
});
