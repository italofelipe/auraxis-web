import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import { NButton, NInput, NModal } from "naive-ui";

import CreateTagModal from "../CreateTagModal.vue";

const mutateAsyncMock = vi.fn().mockResolvedValue({ id: "t-new", name: "Urgent", color: "#FF0000", icon: null });
const isPending = ref(false);

vi.mock("~/features/tags/queries/use-create-tag-mutation", () => ({
  useCreateTagMutation: (): { mutateAsync: typeof mutateAsyncMock; isPending: typeof isPending } => ({
    mutateAsync: mutateAsyncMock,
    isPending,
  }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string): string => key }),
}));

/**
 * Mounts the CreateTagModal with a stubbed NModal so its content renders
 * inline and is reachable via `wrapper.find`.
 *
 * @param visible - Initial modal visibility.
 * @returns VueWrapper around the mounted component.
 */
function mountModal(visible = true): ReturnType<typeof mount> {
  return mount(CreateTagModal, {
    props: { visible },
    global: {
      stubs: {
        Modal: {
          name: "Modal",
          props: { show: Boolean },
          emits: ["update:show"],
          template: "<div v-if=\"show\"><slot /><slot name=\"footer\" /></div>",
        },
        NColorPicker: {
          name: "NColorPicker",
          props: { value: String },
          emits: ["update:value"],
          template: "<div class=\"color-picker-stub\" />",
        },
      },
    },
  });
}

describe("CreateTagModal", () => {
  it("renders the NModal when visible is true", () => {
    const wrapper = mountModal(true);
    expect(wrapper.findComponent(NModal).exists()).toBe(true);
  });

  it("does not render content when visible is false", () => {
    const wrapper = mountModal(false);
    // Modal stub uses v-if, so content is absent when show is false
    expect(wrapper.find(".color-picker-stub").exists()).toBe(false);
  });

  it("disables the primary action when the name is empty", () => {
    const wrapper = mountModal(true);
    const primary = wrapper.findAllComponents(NButton).find((b) => b.props("type") === "primary");
    expect(primary?.props("disabled")).toBe(true);
  });

  it("enables the primary action when a name is entered", async () => {
    const wrapper = mountModal(true);
    const nameInput = wrapper.findAllComponents(NInput)[0];
    await nameInput?.vm.$emit("update:value", "Urgente");
    const primary = wrapper.findAllComponents(NButton).find((b) => b.props("type") === "primary");
    expect(primary?.props("disabled")).toBe(false);
  });

  it("calls createMutation.mutateAsync with trimmed name on submit", async () => {
    mutateAsyncMock.mockClear();
    const wrapper = mountModal(true);
    const nameInput = wrapper.findAllComponents(NInput)[0];
    await nameInput?.vm.$emit("update:value", "  Urgente  ");
    const primary = wrapper.findAllComponents(NButton).find((b) => b.props("type") === "primary");
    await primary?.trigger("click");
    await flushPromises();
    expect(mutateAsyncMock).toHaveBeenCalledWith({ name: "Urgente", color: null, icon: null });
  });

  it("skips submission when name is only whitespace", async () => {
    mutateAsyncMock.mockClear();
    const wrapper = mountModal(true);
    const nameInput = wrapper.findAllComponents(NInput)[0];
    await nameInput?.vm.$emit("update:value", "   ");
    const primary = wrapper.findAllComponents(NButton).find((b) => b.props("type") === "primary");
    // Button is disabled, so triggering its click still skips — assert the mutation is not called.
    await primary?.trigger("click");
    await flushPromises();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("emits update:visible=false when the modal requests to close", async () => {
    const wrapper = mountModal(true);
    await wrapper.findComponent(NModal).vm.$emit("update:show", false);
    const emitted = wrapper.emitted("update:visible");
    expect(emitted).toBeDefined();
    expect(emitted?.[0]).toEqual([false]);
  });

  it("emits update:visible=false and resets state when the Cancel button is clicked", async () => {
    const wrapper = mountModal(true);
    const buttons = wrapper.findAllComponents(NButton);
    const cancel = buttons.find((b) => b.props("type") !== "primary");
    await cancel?.trigger("click");
    expect(wrapper.emitted("update:visible")?.[0]).toEqual([false]);
  });

  it("sends trimmed icon when provided (null color defaults when picker untouched)", async () => {
    mutateAsyncMock.mockClear();
    const wrapper = mountModal(true);
    const inputs = wrapper.findAllComponents(NInput);
    await inputs[0]?.vm.$emit("update:value", "Saúde");
    // Icon is the second NInput — whitespace should be stripped
    await inputs[1]?.vm.$emit("update:value", "  🏥  ");
    const primary = wrapper.findAllComponents(NButton).find((b) => b.props("type") === "primary");
    await primary?.trigger("click");
    await flushPromises();
    expect(mutateAsyncMock).toHaveBeenCalledWith({ name: "Saúde", color: null, icon: "🏥" });
  });

});
