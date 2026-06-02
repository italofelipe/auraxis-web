import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import SpendingInsightCard from "./SpendingInsightCard.vue";

const mockHasPremium = ref(false);

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string) => k }),
}));
vi.mock("#imports", () => ({
  useI18n: (): { t: (k: string) => string } => ({ t: (k: string) => k }),
}));
vi.mock("~/features/paywall/queries/use-entitlement-query", () => ({
  useEntitlementQuery: (): { data: typeof mockHasPremium } => ({ data: mockHasPremium }),
}));
vi.mock("lucide-vue-next", () => ({
  Lock: { template: "<span />" },
  Radar: { template: "<span />" },
}));
vi.mock("naive-ui", () => ({
  NCard: { template: "<section><slot name='header' /><slot /></section>" },
  NButton: { props: ["type", "tag", "href", "size"], template: "<button><slot /></button>" },
}));

const stubs = {
  SpendingInsightContent: { template: "<div data-testid='spending-insight-content-stub' />" },
};

/**
 * @returns Mounted card wrapper.
 */
function mountCard(): ReturnType<typeof mount> {
  return mount(SpendingInsightCard, { global: { stubs } });
}

describe("SpendingInsightCard", () => {
  beforeEach(() => {
    mockHasPremium.value = false;
  });

  it("shows the premium teaser for free users and no content", () => {
    const w = mountCard();
    expect(w.find("[data-testid='spending-insight-locked']").exists()).toBe(true);
    expect(w.find("[data-testid='spending-insight-content-stub']").exists()).toBe(false);
  });

  it("mounts the premium content for entitled users", () => {
    mockHasPremium.value = true;
    const w = mountCard();
    expect(w.find("[data-testid='spending-insight-locked']").exists()).toBe(false);
    expect(w.find("[data-testid='spending-insight-content-stub']").exists()).toBe(true);
  });
});
