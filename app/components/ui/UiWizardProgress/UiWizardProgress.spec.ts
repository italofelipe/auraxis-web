import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import UiWizardProgress from "./UiWizardProgress.vue";

describe("UiWizardProgress", () => {
  it("renders the step label", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 2, total: 5 },
    });

    expect(wrapper.text()).toContain("Pergunta 2 de 5");
  });

  it("renders label for first step", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 1, total: 5 },
    });

    expect(wrapper.text()).toContain("Pergunta 1 de 5");
  });

  it("renders label for last step", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 5, total: 5 },
    });

    expect(wrapper.text()).toContain("Pergunta 5 de 5");
  });

  it("has role='progressbar' on the track element", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 3, total: 5 },
    });

    const track = wrapper.find(".ui-wizard-progress__track");
    expect(track.attributes("role")).toBe("progressbar");
  });

  it("sets aria-valuenow to current step", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 3, total: 5 },
    });

    const track = wrapper.find(".ui-wizard-progress__track");
    expect(track.attributes("aria-valuenow")).toBe("3");
  });

  it("sets aria-valuemax to total steps", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 2, total: 7 },
    });

    const track = wrapper.find(".ui-wizard-progress__track");
    expect(track.attributes("aria-valuemax")).toBe("7");
  });

  it("sets aria-valuemin to 1", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 1, total: 5 },
    });

    const track = wrapper.find(".ui-wizard-progress__track");
    expect(track.attributes("aria-valuemin")).toBe("1");
  });

  it("sets aria-label to the step label text", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 2, total: 5 },
    });

    const track = wrapper.find(".ui-wizard-progress__track");
    expect(track.attributes("aria-label")).toBe("Pergunta 2 de 5");
  });

  it("renders the fill bar at 40% for step 2 of 5", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 2, total: 5 },
    });

    const fill = wrapper.find(".ui-wizard-progress__fill");
    expect(fill.attributes("style")).toContain("width: 40%");
  });

  it("renders the fill bar at 100% when on last step", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 5, total: 5 },
    });

    const fill = wrapper.find(".ui-wizard-progress__fill");
    expect(fill.attributes("style")).toContain("width: 100%");
  });

  it("renders the fill bar at 20% for step 1 of 5", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 1, total: 5 },
    });

    const fill = wrapper.find(".ui-wizard-progress__fill");
    expect(fill.attributes("style")).toContain("width: 20%");
  });

  it("renders fill at 0% when total is 0", () => {
    const wrapper = mount(UiWizardProgress, {
      props: { current: 0, total: 0 },
    });

    const fill = wrapper.find(".ui-wizard-progress__fill");
    expect(fill.attributes("style")).toContain("width: 0%");
  });
});
