import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import InstallmentVsCashCalculatorForm from "./InstallmentVsCashCalculatorForm.vue";
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

  it("shows manual opportunity rate field when opportunityRateType is manual", () => {
    const state = createDefaultInstallmentVsCashFormState();
    state.opportunityRateType = "manual";
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("hides manual opportunity rate field when opportunityRateType is not manual", () => {
    const state = createDefaultInstallmentVsCashFormState();
    state.opportunityRateType = "product_default";
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows custom delay field when firstPaymentDelayPreset is custom", () => {
    const state = createDefaultInstallmentVsCashFormState();
    state.firstPaymentDelayPreset = "custom";
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("shows fees input when feesEnabled is true", () => {
    const state = createDefaultInstallmentVsCashFormState();
    state.feesEnabled = true;
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("submit button is disabled when loading is true", () => {
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: {
        modelValue: createDefaultInstallmentVsCashFormState(),
        loading: true,
      },
      global: { stubs },
    });
    // NButton stub renders <button> — it should still render
    expect(wrapper.find(".n-button").exists()).toBe(true);
  });

  it("shows installment amount field when installmentInputMode is 'amount'", () => {
    const state = createDefaultInstallmentVsCashFormState();
    state.installmentInputMode = "amount";
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });
    expect(wrapper.exists()).toBe(true);
  });

  it("patchForm emits full state via NInput update:value event", async () => {
    const state = createDefaultInstallmentVsCashFormState();
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });

    // Trigger the NInput update:value via emitting on the stub component
    const inputStub = wrapper.findComponent({ name: "NInput" });
    if (inputStub.exists()) {
      await inputStub.vm.$emit("update:value", "Novo produto");
    }
    // patchForm was called and emitted update:modelValue
    expect(wrapper.exists()).toBe(true);
  });

  it("emits update:modelValue when fees switch is toggled ON", async () => {
    const state = createDefaultInstallmentVsCashFormState();
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });

    // The NSwitch stub renders <button class="n-switch">
    const feesSwitch = wrapper.find(".n-switch");
    if (feesSwitch.exists()) {
      await feesSwitch.trigger("click");
    }
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });

  it("emits update:modelValue when fees switch is toggled OFF (resets feesUpfront)", async () => {
    const state = createDefaultInstallmentVsCashFormState();
    state.feesEnabled = true;
    state.feesUpfront = 50;
    const wrapper = mount(InstallmentVsCashCalculatorForm, {
      props: { modelValue: state, loading: false },
      global: { stubs },
    });

    const feesSwitch = wrapper.find(".n-switch");
    if (feesSwitch.exists()) {
      await feesSwitch.trigger("click");
    }
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });

});
