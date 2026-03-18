import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InviteForm from "./InviteForm.vue";

const mockMutate = vi.hoisted(() => vi.fn());

vi.mock("~/features/sharing/queries/use-invite-mutation", () => ({
  useInviteMutation: (): {
    mutate: typeof mockMutate;
    isPending: ReturnType<typeof ref<boolean>>;
    isError: ReturnType<typeof ref<boolean>>;
  } => ({
    mutate: mockMutate,
    isPending: ref(false),
    isError: ref(false),
  }),
}));

vi.mock("naive-ui", () => ({
  NFormItem: {
    template: "<div class='n-form-item'><slot /></div>",
  },
  NInput: {
    props: ["modelValue", "value", "disabled", "placeholder"],
    template: "<input class='n-input' :value='value' :disabled='disabled' @input=\"$emit('update:value', $event.target.value)\" />",
    emits: ["update:value"],
  },
  NButton: {
    props: ["type", "loading", "disabled", "attrType"],
    template: "<button class='n-button' :disabled='disabled || loading' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
}));

describe("InviteForm", () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it("calls mutation with email on form submit", async () => {
    const wrapper = mount(InviteForm);

    const input = wrapper.find("input.n-input");
    await input.setValue("test@example.com");
    await wrapper.find("form").trigger("submit");

    expect(mockMutate).toHaveBeenCalledOnce();
    expect(mockMutate).toHaveBeenCalledWith(
      { inviteeEmail: "test@example.com" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });

  it("does not call mutation when email is empty", async () => {
    const wrapper = mount(InviteForm);

    await wrapper.find("form").trigger("submit");

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
