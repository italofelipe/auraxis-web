import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import UiBottomSheet from "./UiBottomSheet.vue";

/**
 * Mounts the sheet with the teleport stubbed inline so content is queryable.
 *
 * @param props Props overrides.
 * @returns Mounted wrapper.
 */
const mountSheet = (props: Record<string, unknown> = {}): ReturnType<typeof mount> =>
  mount(UiBottomSheet, {
    props: { modelValue: true, ...props },
    slots: { default: "<button data-testid='inner'>x</button>" },
    global: { stubs: { teleport: true } },
  });

describe("UiBottomSheet", () => {
  it("does not render the panel when closed", () => {
    const wrapper = mountSheet({ modelValue: false });
    expect(wrapper.find("[data-testid='ui-bottom-sheet-scrim']").exists()).toBe(false);
  });

  it("renders scrim, panel and slotted content when open", () => {
    const wrapper = mountSheet();
    expect(wrapper.find("[data-testid='ui-bottom-sheet-scrim']").exists()).toBe(true);
    expect(wrapper.find("[role='dialog']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='inner']").exists()).toBe(true);
  });

  it("emits close on scrim click", async () => {
    const wrapper = mountSheet();
    await wrapper.find("[data-testid='ui-bottom-sheet-scrim']").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("does not close on scrim click when closeOnScrim is false", async () => {
    const wrapper = mountSheet({ closeOnScrim: false });
    await wrapper.find("[data-testid='ui-bottom-sheet-scrim']").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("emits close on Escape", async () => {
    const wrapper = mountSheet();
    await wrapper.find(".ui-bottom-sheet").trigger("keydown", { key: "Escape" });
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });
});
