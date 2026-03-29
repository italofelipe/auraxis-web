import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import QuestionnaireStepCard from "./QuestionnaireStepCard.vue";
import type { QuestionnaireQuestionDto } from "~/features/investor-profile/contracts/investor-profile.dto";

/**
 * Builds a minimal QuestionnaireQuestionDto fixture for testing.
 *
 * @returns QuestionnaireQuestionDto fixture.
 */
const makeQuestion = (): QuestionnaireQuestionDto => ({
  id: 1,
  text: "Qual o seu principal objetivo ao investir?",
  options: [
    { id: 1, text: "Preservar meu patrimônio", points: 1 },
    { id: 2, text: "Crescimento moderado", points: 2 },
    { id: 3, text: "Maximizar a rentabilidade", points: 3 },
  ],
});

describe("QuestionnaireStepCard", () => {
  it("renders the question text", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    expect(wrapper.text()).toContain("Qual o seu principal objetivo ao investir?");
  });

  it("renders a UiOptionCardRadio for each option", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    const radios = wrapper.findAll(".ui-option-card-radio");
    expect(radios).toHaveLength(3);
  });

  it("renders the progress label via UiWizardProgress", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 2,
        totalSteps: 5,
      },
    });

    expect(wrapper.text()).toContain("Pergunta 2 de 5");
  });

  it("passes selected=true to the matching option", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: 2,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    const radios = wrapper.findAll(".ui-option-card-radio");
    const secondRadio = radios[1];
    expect(secondRadio).toBeDefined();
    expect(secondRadio!.classes()).toContain("ui-option-card-radio--selected");
  });

  it("does not mark any option as selected when selectedOptionId is null", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    const selected = wrapper.findAll(".ui-option-card-radio--selected");
    expect(selected).toHaveLength(0);
  });

  it("emits 'select' with the option id when a radio is clicked", async () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    const firstRadio = wrapper.findAll(".ui-option-card-radio")[0];
    expect(firstRadio).toBeDefined();
    await firstRadio!.trigger("click");

    expect(wrapper.emitted("select")).toBeTruthy();
    expect(wrapper.emitted("select")![0]).toEqual([1]);
  });

  it("has a radiogroup container for accessibility", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    const radiogroup = wrapper.find("[role='radiogroup']");
    expect(radiogroup.exists()).toBe(true);
  });

  it("sets aria-label on radiogroup to the question text", () => {
    const wrapper = mount(QuestionnaireStepCard, {
      props: {
        question: makeQuestion(),
        selectedOptionId: null,
        stepIndex: 1,
        totalSteps: 5,
      },
    });

    const radiogroup = wrapper.find("[role='radiogroup']");
    expect(radiogroup.attributes("aria-label")).toBe(
      "Qual o seu principal objetivo ao investir?",
    );
  });
});
