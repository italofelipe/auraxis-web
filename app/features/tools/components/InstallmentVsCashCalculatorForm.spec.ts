import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import InstallmentVsCashCalculatorForm from "./InstallmentVsCashCalculatorForm.vue";
import UiInfoTooltip from "~/shared/components/UiInfoTooltip/UiInfoTooltip.vue";
import { createDefaultInstallmentVsCashFormState } from "~/features/tools/model/installment-vs-cash";

const stubs = {
  NButton: {
    props: ["type", "size", "loading", "disabled", "attrType"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
  NForm: {
    template: "<form class='n-form' @submit.prevent='$emit(\"submit\")'><slot /></form>",
    emits: ["submit"],
  },
  NFormItem: {
    props: ["label"],
    template: "<div class='n-form-item'><slot /></div>",
  },
  NInput: {
    props: ["value", "placeholder", "clearable", "type"],
    template: "<input class='n-input' @input='$emit(\"update:value\", $event.target.value)' />",
    emits: ["update:value"],
  },
  NInputNumber: {
    props: ["value", "min", "max", "precision", "showButton", "placeholder"],
    template: "<input class='n-input-number' @input='$emit(\"update:value\", Number($event.target.value))' />",
    emits: ["update:value"],
  },
  NSelect: {
    props: ["value", "options"],
    template: "<select class='n-select' @change='$emit(\"update:value\", $event.target.value)' />",
    emits: ["update:value"],
  },
  NSwitch: {
    props: ["value"],
    template: "<button class='n-switch' @click='$emit(\"update:value\", !value)' />",
    emits: ["update:value"],
  },
  UiSegmentedControl: {
    props: ["modelValue", "options"],
    template: "<button class='segmented' @click='$emit(\"update:modelValue\", options[1].value)' />",
    emits: ["update:modelValue"],
  },
  NTooltip: {
    template: "<div><slot name='trigger' /><slot /></div>",
  },
  UiIcon: {
    template: "<svg class='ui-icon' />",
  },
};

describe("InstallmentVsCashCalculatorForm", () => {
  it("emits a full form update when switching the installment mode", async () => {
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: {
        modelValue: createDefaultInstallmentVsCashFormState(),
        loading: false,
      },
      global: { stubs },
    });

    await wrapper.find(".segmented").trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });

  it("emits submit when the form button is clicked", async () => {
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: {
        modelValue: createDefaultInstallmentVsCashFormState(),
        loading: false,
      },
      global: { stubs },
    });

    await wrapper.find(".n-button").trigger("click");

    expect(wrapper.text()).toContain("Calcular agora");
  });

  it("renders tooltip copy for critical concepts", () => {
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: {
        modelValue: createDefaultInstallmentVsCashFormState(),
        loading: false,
      },
      global: { stubs },
    });

    const tooltips = wrapper.findAllComponents(UiInfoTooltip);

    expect(tooltips).toHaveLength(4);
    expect(tooltips[0]?.props("label")).toBe("Entender primeira parcela");
    expect(tooltips[1]?.props("label")).toBe("Entender taxa de oportunidade");
    expect(tooltips[2]?.props("label")).toBe("Entender inflacao anual");
    expect(tooltips[3]?.props("label")).toBe("Entender custos extras");
  });
});
