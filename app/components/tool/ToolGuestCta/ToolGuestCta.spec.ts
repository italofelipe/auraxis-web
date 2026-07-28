import { ref, type Ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ToolGuestCta from "./ToolGuestCta.vue";

/* ── Module mocks ──────────────────────────────────────────────────────────── */

const navigateToMock = vi.fn();
const showCtaRef = ref(true);
let mockedSurface: string | undefined;

vi.mock("~/features/tools/composables/useToolCta", () => ({
  useToolCta: (): { showCta: Ref<boolean> } => ({
    showCta: showCtaRef,
  }),
}));

vi.mock("#app", () => ({
  navigateTo: (...args: unknown[]): unknown => navigateToMock(...args),
  tryUseNuxtApp: (): unknown => ({ $config: { public: { siteSurface: mockedSurface } } }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

vi.mock("lucide-vue-next", () => ({
  BarChart3:   { template: "<span class='icon-bar-chart' />" },
  Target:      { template: "<span class='icon-target' />" },
  ShieldCheck: { template: "<span class='icon-shield' />" },
  Zap:         { template: "<span class='icon-zap' />" },
  Sparkles:    { template: "<span class='icon-sparkles' />" },
  ArrowRight:  { template: "<span class='icon-arrow-right' />" },
}));

const stubs = {
  NButton: {
    template: "<button class='n-button' @click=\"$emit('click')\"><slot /></button>",
    emits: ["click"],
  },
  IllustrationFinanceGrowth: {
    template: "<svg class='illustration-finance-growth' aria-hidden='true' />",
  },
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */

beforeEach(() => {
  showCtaRef.value = true;
  mockedSurface = "marketing";
  vi.clearAllMocks();
});

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe("ToolGuestCta", () => {
  it("renders the CTA section when showCta is true", () => {
    showCtaRef.value = true;

    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.find(".tool-guest-cta").exists()).toBe(true);
  });

  it("does not render when showCta is false (authenticated user)", () => {
    showCtaRef.value = false;

    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.find(".tool-guest-cta").exists()).toBe(false);
  });

  it("renders four feature items", () => {
    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.findAll(".tool-guest-cta__feature")).toHaveLength(4);
  });

  it("renders the badge, title, subtitle and trust line", () => {
    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.find(".tool-guest-cta__badge").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta__title").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta__subtitle").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta__trust").exists()).toBe(true);
  });

  it("renders two action buttons", () => {
    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.findAll(".n-button")).toHaveLength(2);
  });

  it("navigates to /register when primary CTA is clicked", async () => {
    navigateToMock.mockResolvedValue(undefined);

    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    const buttons = wrapper.findAll(".n-button");
    await buttons[0]!.trigger("click");

    expect(navigateToMock).toHaveBeenCalledWith("/register", undefined);
  });

  it("navigates to /login when secondary CTA is clicked", async () => {
    navigateToMock.mockResolvedValue(undefined);

    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    const buttons = wrapper.findAll(".n-button");
    await buttons[1]!.trigger("click");

    expect(navigateToMock).toHaveBeenCalledWith("/login", undefined);
  });

  it("crosses to the app host with an external navigation on the landing surface", async () => {
    mockedSurface = "landing";
    navigateToMock.mockResolvedValue(undefined);

    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    const buttons = wrapper.findAll(".n-button");
    await buttons[0]!.trigger("click");
    expect(navigateToMock).toHaveBeenCalledWith("https://app.auraxis.com.br/register", {
      external: true,
    });

    await buttons[1]!.trigger("click");
    expect(navigateToMock).toHaveBeenCalledWith("https://app.auraxis.com.br/login", {
      external: true,
    });
  });

  it("renders all four color variant icon wrappers", () => {
    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.find(".tool-guest-cta__feature-icon--blue").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta__feature-icon--green").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta__feature-icon--purple").exists()).toBe(true);
    expect(wrapper.find(".tool-guest-cta__feature-icon--amber").exists()).toBe(true);
  });

  it("uses i18n keys for all text content", () => {
    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.find(".tool-guest-cta__title").text()).toBe("toolGuestCta.title");
    expect(wrapper.find(".tool-guest-cta__subtitle").text()).toBe("toolGuestCta.subtitle");
    expect(wrapper.find(".tool-guest-cta__trust").text()).toBe("toolGuestCta.trust");
  });

  it("has correct aria-label on the section", () => {
    const wrapper = mount(ToolGuestCta, { global: { stubs } });

    expect(wrapper.find(".tool-guest-cta").attributes("aria-label")).toBe("toolGuestCta.ariaLabel");
  });
});
