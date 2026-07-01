import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import AiChatComposer from "./AiChatComposer.vue";

const stubs = {
  NInput: {
    props: ["value", "disabled"],
    emits: ["update:value"],
    template:
      "<textarea :value='value' :disabled='disabled' @input=\"$emit('update:value', $event.target.value)\" />",
  },
  SendHorizontal: true,
};

describe("AiChatComposer", () => {
  it("emits the trimmed question and clears the draft on submit", async () => {
    const wrapper = mount(AiChatComposer, { global: { stubs } });

    await wrapper.find("textarea").setValue("  Quanto gastei?  ");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")?.[0]).toEqual(["Quanto gastei?"]);
    expect((wrapper.find("textarea").element as HTMLTextAreaElement).value).toBe("");
  });

  it("does not emit when the draft is blank", async () => {
    const wrapper = mount(AiChatComposer, { global: { stubs } });

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeFalsy();
  });

  it("does not emit while disabled", async () => {
    const wrapper = mount(AiChatComposer, { props: { disabled: true }, global: { stubs } });

    await wrapper.find("textarea").setValue("Oi");
    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeFalsy();
  });
});
