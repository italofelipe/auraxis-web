import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import UiListPanel from "../UiListPanel.vue";

const UiSurfaceCardStub = { template: "<div class=\"ui-surface-card\"><slot /></div>" };

/**
 * Mounts UiListPanel with UiSurfaceCard stubbed for isolation.
 *
 * @param options - Mount options forwarded to @vue/test-utils.
 * @returns VueWrapper around the mounted component.
 */
function mountPanel(options: Parameters<typeof mount>[1] = {}): ReturnType<typeof mount> {
  return mount(UiListPanel, {
    ...options,
    global: {
      ...options.global,
      stubs: { UiSurfaceCard: UiSurfaceCardStub, ...options.global?.stubs },
    },
  });
}

describe("UiListPanel", () => {
  it("renders the title when provided", () => {
    const wrapper = mountPanel({ props: { title: "Próximos vencimentos" } });
    expect(wrapper.find(".ui-list-panel__title").text()).toBe("Próximos vencimentos");
  });

  it("omits the header when neither title nor header-action slot is provided", () => {
    const wrapper = mountPanel();
    expect(wrapper.find(".ui-list-panel__header").exists()).toBe(false);
  });

  it("renders the header when a header-action slot is provided without title", () => {
    const wrapper = mountPanel({
      slots: { "header-action": "<button>Ver todos</button>" },
    });
    expect(wrapper.find(".ui-list-panel__header").exists()).toBe(true);
    expect(wrapper.find(".ui-list-panel__header-action button").exists()).toBe(true);
  });

  it("renders default slot content when not loading", () => {
    const wrapper = mountPanel({
      slots: { default: "<li>Item 1</li>" },
    });
    expect(wrapper.find(".ui-list-panel__body").text()).toContain("Item 1");
  });

  it("renders skeleton rows when loading is true", () => {
    const wrapper = mountPanel({ props: { loading: true, loadingRows: 3 } });
    expect(wrapper.findAll(".ui-list-panel__skeleton-row")).toHaveLength(3);
  });

  it("uses loadingRows default of 4 when not specified", () => {
    const wrapper = mountPanel({ props: { loading: true } });
    expect(wrapper.findAll(".ui-list-panel__skeleton-row")).toHaveLength(4);
  });

  it("does not render skeleton rows when not loading", () => {
    const wrapper = mountPanel({ props: { loading: false } });
    expect(wrapper.findAll(".ui-list-panel__skeleton-row")).toHaveLength(0);
  });

  it("renders the filters slot when provided", () => {
    const wrapper = mountPanel({
      slots: { filters: "<div class='filter-bar'>filter</div>" },
    });
    expect(wrapper.find(".ui-list-panel__filters").exists()).toBe(true);
    expect(wrapper.find(".filter-bar").exists()).toBe(true);
  });

  it("omits the filters area when no filters slot is provided", () => {
    const wrapper = mountPanel({ props: { title: "Panel" } });
    expect(wrapper.find(".ui-list-panel__filters").exists()).toBe(false);
  });

  it("skeleton rows have aria-hidden to keep them out of the a11y tree", () => {
    const wrapper = mountPanel({ props: { loading: true, loadingRows: 2 } });
    wrapper.findAll(".ui-list-panel__skeleton-row").forEach((row) => {
      expect(row.attributes("aria-hidden")).toBe("true");
    });
  });
});
