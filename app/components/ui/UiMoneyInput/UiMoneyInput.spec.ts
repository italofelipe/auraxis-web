import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import UiMoneyInput from "./UiMoneyInput.vue";

vi.mock("naive-ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NInputNumber: {
      name: "NInputNumber",
      props: ["value", "parse", "format", "placeholder", "min", "disabled", "clearable", "inputProps"],
      emits: ["update:value"],
      template: `
        <input
          class="n-input-number"
          :disabled="disabled"
          :placeholder="placeholder"
          :inputmode="inputProps?.inputmode"
          :value="format ? format(value) : value"
          @input="$emit('update:value', parse ? parse($event.target.value) : Number($event.target.value))"
        />
      `,
    },
  };
});

describe("UiMoneyInput", () => {
  it("emits values using cents-entry typing semantics", async () => {
    const wrapper = mount(UiMoneyInput, {
      props: {
        value: null,
        "onUpdate:value": (value: number | null) => wrapper.setProps({ value }),
      },
    });
    const input = wrapper.find("input");

    await input.setValue("1");
    expect(wrapper.emitted("update:value")?.at(-1)).toEqual([0.01]);

    await input.setValue("12");
    expect(wrapper.emitted("update:value")?.at(-1)).toEqual([0.12]);

    await input.setValue("120");
    expect(wrapper.emitted("update:value")?.at(-1)).toEqual([1.2]);

    await input.setValue("1202");
    expect(wrapper.emitted("update:value")?.at(-1)).toEqual([12.02]);

    await input.setValue("12025");
    expect(wrapper.emitted("update:value")?.at(-1)).toEqual([120.25]);
  });

  it("renders the current value formatted while keeping numeric mobile input hints", () => {
    const wrapper = mount(UiMoneyInput, {
      props: { value: 120.25, placeholder: "0,00" },
    });

    const input = wrapper.find("input");
    expect(input.attributes("value")).toContain("120,25");
    expect(input.attributes("inputmode")).toBe("numeric");
  });
});
