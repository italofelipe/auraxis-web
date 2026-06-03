import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref, computed, type ComputedRef, type VNode } from "vue";
import type { GlobalTheme } from "naive-ui";
import UiTopbar from "../UiTopbar.vue";

vi.mock("vue-i18n");

vi.mock("~/composables/useTheme", () => ({
  useTheme: (): { isDark: ReturnType<typeof ref<boolean>>; toggle: () => void; naiveTheme: ComputedRef<GlobalTheme | null> } => ({
    isDark: ref(true),
    toggle: vi.fn(),
    naiveTheme: computed<GlobalTheme | null>(() => null),
  }),
}));

const MockIcon = defineComponent({ render: () => h("span", "icon") });

describe("UiTopbar", () => {
  it("renders title via UiPageHeader", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-page-header__title").text()).toBe("Dashboard");
  });

  it("renders subtitle via UiPageHeader when provided", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", subtitle: "Mês de Dezembro", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-page-header__subtitle").text()).toBe("Mês de Dezembro");
  });

  it("does not render subtitle when absent", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-page-header__subtitle").exists()).toBe(false);
  });

  it("renders action buttons", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", variant: "positive" },
          { key: "add-expense", label: "Despesa", variant: "negative" },
        ],
      },
    });
    const actions = wrapper.findAll(".ui-topbar__action");
    expect(actions).toHaveLength(2);
    expect(actions[0]!.text()).toContain("Receita");
    expect(actions[1]!.text()).toContain("Despesa");
  });

  it("emits action with correct key when action button is clicked", async () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", variant: "positive" },
          { key: "add-expense", label: "Despesa", variant: "negative" },
        ],
      },
    });
    await wrapper.findAll(".ui-topbar__action")[0]!.trigger("click");
    expect(wrapper.emitted("action")).toBeTruthy();
    expect(wrapper.emitted("action")![0]).toEqual(["add-income"]);
  });

  it("emits action with correct key for second action", async () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", variant: "positive" },
          { key: "add-expense", label: "Despesa", variant: "negative" },
        ],
      },
    });
    await wrapper.findAll(".ui-topbar__action")[1]!.trigger("click");
    expect(wrapper.emitted("action")![0]).toEqual(["add-expense"]);
  });

  it("does not render menu button when showMenuButton is false", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: false },
    });
    expect(wrapper.find(".ui-topbar__menu-btn").exists()).toBe(false);
  });

  it("renders menu button when showMenuButton is true", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
    });
    expect(wrapper.find(".ui-topbar__menu-btn").exists()).toBe(true);
  });

  it("emits menu-toggle when menu button is clicked", async () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
    });
    await wrapper.find(".ui-topbar__menu-btn").trigger("click");
    expect(wrapper.emitted("menu-toggle")).toBeTruthy();
  });

  it("renders UiUserMenu", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find(".ui-user-menu").exists()).toBe(true);
  });

  it("applies correct variant class to action button", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", icon: MockIcon, variant: "positive" },
        ],
      },
    });
    const action = wrapper.find(".ui-topbar__action");
    expect(action.classes()).toContain("ui-topbar__action--positive");
  });

  it("renders action icon when provided", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [
          { key: "add-income", label: "Receita", icon: MockIcon, variant: "positive" },
        ],
      },
    });
    expect(wrapper.find(".ui-topbar__action span").text()).toBe("icon");
  });

  it("emits user-settings when UiUserMenu emits settings", async () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    // Trigger directly from the UiUserMenu's settings button
    wrapper.findComponent({ name: "UiUserMenu" }).vm.$emit("settings");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("user-settings")).toBeTruthy();
  });

  it("emits user-onboarding when UiUserMenu emits onboarding", async () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    wrapper.findComponent({ name: "UiUserMenu" }).vm.$emit("onboarding");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("user-onboarding")).toBeTruthy();
  });

  it("emits user-logout when UiUserMenu emits logout", async () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    wrapper.findComponent({ name: "UiUserMenu" }).vm.$emit("logout");
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted("user-logout")).toBeTruthy();
  });

  it("renders action without icon when icon not provided", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        actions: [{ key: "noop", label: "Sem ícone", variant: "default" }],
      },
    });
    expect(wrapper.find(".ui-topbar__action").text()).toContain("Sem ícone");
  });

  it("renders with userDescription and userAvatarUrl", () => {
    const wrapper = mount(UiTopbar, {
      props: {
        title: "Dashboard",
        userName: "João Silva",
        userDescription: "Investidor Moderado",
        userAvatarUrl: "https://example.com/avatar.jpg",
      },
    });
    expect(wrapper.find(".ui-user-menu").exists()).toBe(true);
  });

  it("renders the extras row container", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva" },
    });
    expect(wrapper.find("[data-testid='topbar-extras-row']").exists()).toBe(true);
  });

  it("renders slotted extras content inside the extras row (two-tier header)", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
      slots: { extras: (): unknown => h("span", { class: "premium-badge" }, "Premium") },
    });
    const extrasRow = wrapper.find("[data-testid='topbar-extras-row']");
    expect(extrasRow.exists()).toBe(true);
    expect(extrasRow.find(".premium-badge").exists()).toBe(true);
    expect(extrasRow.text()).toContain("Premium");
  });

  // --- Zero-footprint behavior for the extras row (free vs premium) ---
  // The extras row carries vertical spacing on its rendered child (`> *`), never
  // on the wrapper itself. So an empty / comment-only wrapper has no element
  // children and therefore zero footprint — no empty second row for free users.

  it("(a) keeps the extras row free of element children when NO extras slot is provided", () => {
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
    });
    const extrasRow = wrapper.find("[data-testid='topbar-extras-row']");
    expect(extrasRow.exists()).toBe(true);
    // No element children → `.ui-topbar__extras-row > *` matches nothing →
    // the wrapper contributes no spacing/height.
    expect(extrasRow.element.children.length).toBe(0);
    expect(extrasRow.text()).toBe("");
  });

  it("(b) keeps the extras row free of element children when the slot renders nothing (free user)", () => {
    // Mirrors TopbarSubscriptionBadge for a free user: a component whose root is
    // gated by `v-if=false`, so it renders only a comment node (`<!--v-if-->`).
    const EmptyBadgeStub = defineComponent({
      setup() {
        const show = ref(false);
        return (): VNode | null => (show.value ? h("span", { class: "premium-badge" }, "Premium") : null);
      },
    });
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
      slots: { extras: (): unknown => h(EmptyBadgeStub) },
    });
    const extrasRow = wrapper.find("[data-testid='topbar-extras-row']");
    expect(extrasRow.exists()).toBe(true);
    // The slot IS provided, but the badge renders only a comment node, so there
    // is no element child to receive top-margin → zero footprint, no empty row.
    expect(extrasRow.element.children.length).toBe(0);
    expect(extrasRow.find(".premium-badge").exists()).toBe(false);
    expect(extrasRow.text()).toBe("");
  });

  it("(c) renders the badge as an element child of the extras row for a premium user", () => {
    const PremiumBadgeStub = defineComponent({
      setup() {
        const show = ref(true);
        return (): VNode | null => (show.value ? h("span", { class: "premium-badge" }, "Premium") : null);
      },
    });
    const wrapper = mount(UiTopbar, {
      props: { title: "Dashboard", userName: "João Silva", showMenuButton: true },
      slots: { extras: (): unknown => h(PremiumBadgeStub) },
    });
    const extrasRow = wrapper.find("[data-testid='topbar-extras-row']");
    expect(extrasRow.element.children.length).toBe(1);
    expect(extrasRow.find(".premium-badge").exists()).toBe(true);
    expect(extrasRow.text()).toContain("Premium");
  });
});
