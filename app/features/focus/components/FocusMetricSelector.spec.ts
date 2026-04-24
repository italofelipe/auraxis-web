import { describe, it, expect, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { FOCUS_METRIC_IDS } from "../model/focus-metric";
import FocusMetricSelector from "./FocusMetricSelector.vue";

vi.mock("vue-i18n");

const { NModalStub } = vi.hoisted(() => ({
  NModalStub: {
    name: "NModal",
    props: { show: Boolean },
    template: "<div v-if=\"show\" data-testid=\"n-modal-stub\"><slot /></div>",
  },
}));

vi.mock("naive-ui", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, NModal: NModalStub };
});

/**
 * Mounts FocusMetricSelector with the stubbed NModal teleport-free shell.
 *
 * @param open Whether the selector is open.
 * @param selectedId Currently selected focus metric id.
 * @returns A Vue Test Utils wrapper for the mounted component.
 */
function mountSelector(
  open = true,
  selectedId: (typeof FOCUS_METRIC_IDS)[number] = "freeBalanceAfterFixed",
): VueWrapper {
  return mount(FocusMetricSelector, {
    props: { open, selectedId },
    global: {
      stubs: {
        NModal: NModalStub,
      },
    },
  });
}

describe("FocusMetricSelector", () => {
  it("renders an option for every canonical metric id", () => {
    const wrapper = mountSelector();
    for (const id of FOCUS_METRIC_IDS) {
      expect(wrapper.find(`[data-testid='focus-metric-option-${id}']`).exists()).toBe(true);
    }
  });

  it("marks the currently selected option as active", () => {
    const wrapper = mountSelector(true, "monthlyBurnRate");
    const active = wrapper.get("[data-testid='focus-metric-option-monthlyBurnRate']");
    expect(active.classes()).toContain("focus-selector__option--active");
  });

  it("emits 'select' and 'close' when an option is clicked", async () => {
    const wrapper = mountSelector();
    await wrapper.get("[data-testid='focus-metric-option-primaryGoalProgress']").trigger("click");
    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual(["primaryGoalProgress"]);
    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
