import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import { nextTick, reactive, ref, type Ref } from "vue";
import UiAppShell from "../UiAppShell.vue";
import { LayoutDashboard, Wallet } from "lucide-vue-next";

const routeMock = reactive({ path: "/dashboard" });

vi.mock("vue-router", () => ({
  useRoute: (): { path: string } => routeMock,
}));

// Refs compartilhados: a versão anterior criava um ref e um toggle novos a cada
// chamada, então não havia como inspecionar o efeito do clique.
const isCollapsedRef = ref(false);
const toggleMock = vi.fn(() => {
  isCollapsedRef.value = !isCollapsedRef.value;
});

vi.mock("~/composables/useSidebarState", () => ({
  useSidebarState: (): {
    isCollapsed: Ref<boolean>;
    toggle: () => void;
    collapse: () => void;
    expand: () => void;
  } => ({
    isCollapsed: isCollapsedRef,
    toggle: toggleMock,
    collapse: vi.fn(),
    expand: vi.fn(),
  }),
}));

const closeDrawerMock = vi.fn(() => {
  isDrawerOpenRef.value = false;
});
const openDrawerMock = vi.fn(() => {
  isDrawerOpenRef.value = true;
});
const isMobileRef = ref(false);
const isDrawerOpenRef = ref(false);

vi.mock("~/composables/useResponsiveShell", () => ({
  useResponsiveShell: (): {
    isMobile: Ref<boolean>;
    isDrawerOpen: Ref<boolean>;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
  } => ({
    isMobile: isMobileRef,
    isDrawerOpen: isDrawerOpenRef,
    openDrawer: openDrawerMock,
    closeDrawer: closeDrawerMock,
    toggleDrawer: vi.fn(),
  }),
}));

const defaultProps = {
  navItems: [
    {
      key: "dashboard",
      label: "Dashboard",
      to: "/dashboard",
      icon: LayoutDashboard,
    },
    { key: "wallet", label: "Carteira", to: "/carteira", icon: Wallet },
  ],
  user: { name: "João Silva", description: "Investidor Moderado" },
  pageTitle: "Dashboard",
  pageSubtitle: "Dezembro 2025",
};

const UiTopbarStub = {
  template: `<header
    @click.self="$emit('menu-toggle')"
    data-testid="topbar"
  />`,
  emits: ["action", "user-settings", "user-onboarding", "user-logout", "menu-toggle"],
};

const globalConfig = {
  plugins: [createPinia()],
  stubs: {
    NuxtLink: { template: "<a :href=\"to\"><slot /></a>", props: ["to"] },
    UiSidebarNav: { template: "<nav />" },
    UiTopbar: UiTopbarStub,
    Transition: { template: "<slot />" },
  },
};

/**
 * Mounts UiAppShell with a UiTopbar stub that emits `event` (with optional
 * `payload`) immediately in its `mounted()` hook.
 *
 * Used by the topbar event-forwarding tests to avoid repeating the same
 * inline stub definition three times.
 *
 * @param event The event name to emit from the stub.
 * @param payload Optional payload passed as the second argument to $emit.
 * @returns Mounted wrapper.
 */
const mountWithTopbarEmitting = (event: string, payload?: unknown): VueWrapper =>
  mount(UiAppShell, {
    props: defaultProps,
    global: {
      ...globalConfig,
      stubs: {
        ...globalConfig.stubs,
        UiTopbar: {
          template: "<header />",
          emits: ["action", "user-settings", "user-onboarding", "user-logout", "menu-toggle"],
          mounted() {
            (this as unknown as { $emit: (e: string, v?: unknown) => void }).$emit(event, payload);
          },
        },
      },
    },
  });

describe("UiAppShell", () => {
  beforeEach(() => {
    routeMock.path = "/dashboard";
    isMobileRef.value = false;
    isDrawerOpenRef.value = false;
    isCollapsedRef.value = false;
    toggleMock.mockClear();
    closeDrawerMock.mockClear();
    openDrawerMock.mockClear();
  });

  it("renders sidebar and main area", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.find(".ui-app-shell__sidebar").exists()).toBe(true);
    expect(wrapper.find(".ui-app-shell__main").exists()).toBe(true);
  });

  it("renders slot content in main area", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
      slots: { default: "<p class=\"test-content\">Conteúdo</p>" },
    });
    expect(wrapper.find(".test-content").exists()).toBe(true);
  });

  it("renders logo text Auraxis", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.find(".ui-app-shell__logo-text").text()).toBe("Auraxis");
  });

  it("renders topbar (header element) inside main area", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    // UiTopbar is stubbed as <header />
    expect(wrapper.find("header").exists()).toBe(true);
  });

  it("sidebar has aria-label", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    const sidebar = wrapper.find(".ui-app-shell__sidebar");
    expect(sidebar.attributes("aria-label")).toBe("Navegação principal");
  });

  it("emits topbar-action when topbar emits action event", async () => {
    const wrapper = mountWithTopbarEmitting("action", "my-action");
    const emitted = wrapper.emitted("topbar-action");
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(["my-action"]);
  });

  it("emits user-settings when topbar emits user-settings", () => {
    const wrapper = mountWithTopbarEmitting("user-settings");
    expect(wrapper.emitted("user-settings")).toBeTruthy();
  });

  it("emits user-onboarding when topbar emits user-onboarding", () => {
    const wrapper = mountWithTopbarEmitting("user-onboarding");
    expect(wrapper.emitted("user-onboarding")).toBeTruthy();
  });

  it("emits user-logout when topbar emits user-logout", () => {
    const wrapper = mountWithTopbarEmitting("user-logout");
    expect(wrapper.emitted("user-logout")).toBeTruthy();
  });

  it("closes the mobile drawer when the route changes", async () => {
    isMobileRef.value = true;
    isDrawerOpenRef.value = true;
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(
      wrapper.find(".ui-app-shell__sidebar--drawer-open").exists(),
    ).toBe(true);

    routeMock.path = "/carteira";
    await nextTick();

    expect(closeDrawerMock).toHaveBeenCalled();
    expect(
      wrapper.find(".ui-app-shell__sidebar--drawer-open").exists(),
    ).toBe(false);
  });

  it("snapshot default state", () => {
    const wrapper = mount(UiAppShell, {
      props: defaultProps,
      global: globalConfig,
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  describe("recolher a sidebar", () => {
    it("expõe um controle que alterna o estado e anuncia o destino", async () => {
      const wrapper = mount(UiAppShell, { props: defaultProps, global: globalConfig });
      const toggleButton = wrapper.find(".ui-app-shell__toggle");

      expect(toggleButton.exists()).toBe(true);
      expect(toggleButton.attributes("aria-label")).toBe("Recolher menu lateral");
      expect(toggleButton.attributes("aria-expanded")).toBe("true");

      await toggleButton.trigger("click");

      expect(toggleMock).toHaveBeenCalledTimes(1);
      expect(wrapper.find(".ui-app-shell__toggle").attributes("aria-label"))
        .toBe("Expandir menu lateral");
      expect(wrapper.find(".ui-app-shell__toggle").attributes("aria-expanded"))
        .toBe("false");
    });

    it("aponta para a navegação que o controle governa", () => {
      const wrapper = mount(UiAppShell, { props: defaultProps, global: globalConfig });

      const controls = wrapper.find(".ui-app-shell__toggle").attributes("aria-controls");
      expect(controls).toBe("ui-app-shell-nav");
      expect(wrapper.find(`#${controls}`).exists()).toBe(true);
    });

    it("encolhe a sidebar e esconde o nome da marca quando recolhida", async () => {
      const wrapper = mount(UiAppShell, { props: defaultProps, global: globalConfig });

      expect(wrapper.find(".ui-app-shell__logo-text").exists()).toBe(true);

      isCollapsedRef.value = true;
      await nextTick();

      expect(wrapper.find(".ui-app-shell__sidebar--collapsed").exists()).toBe(true);
      expect(wrapper.find(".ui-app-shell__logo-text").exists()).toBe(false);
    });

    it("ignora o estado recolhido no mobile, onde a sidebar é drawer", async () => {
      isCollapsedRef.value = true;
      isMobileRef.value = true;
      isDrawerOpenRef.value = true;
      const wrapper = mount(UiAppShell, { props: defaultProps, global: globalConfig });
      await nextTick();

      // Recolher para 72px dentro de um drawer deixaria uma faixa de ícones
      // flutuando sobre a página — o drawer já é o modo compacto no mobile.
      expect(wrapper.find(".ui-app-shell__sidebar--collapsed").exists()).toBe(false);
      expect(wrapper.find(".ui-app-shell__toggle").attributes("aria-label"))
        .toBe("Fechar menu");
    });
  });

  describe("saída por teclado do drawer mobile", () => {
    it("fecha o drawer no Esc — o backdrop só respondia a clique", async () => {
      isMobileRef.value = true;
      isDrawerOpenRef.value = true;
      const wrapper = mount(UiAppShell, { props: defaultProps, global: globalConfig });
      await nextTick();

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await nextTick();

      expect(closeDrawerMock).toHaveBeenCalled();
      expect(wrapper.find(".ui-app-shell__overlay").exists()).toBe(false);
    });

    it("não reage ao Esc quando o drawer está fechado", async () => {
      isMobileRef.value = true;
      isDrawerOpenRef.value = false;
      mount(UiAppShell, { props: defaultProps, global: globalConfig });
      await nextTick();

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await nextTick();

      expect(closeDrawerMock).not.toHaveBeenCalled();
    });

    it("não reage ao Esc no desktop, onde não há drawer", async () => {
      isMobileRef.value = false;
      isDrawerOpenRef.value = true;
      mount(UiAppShell, { props: defaultProps, global: globalConfig });
      await nextTick();

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      await nextTick();

      expect(closeDrawerMock).not.toHaveBeenCalled();
    });
  });
});
