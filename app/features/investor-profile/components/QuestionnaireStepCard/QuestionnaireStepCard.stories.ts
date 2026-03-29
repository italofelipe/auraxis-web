import type { Meta, StoryObj } from "@storybook/vue3";
import type { QuestionnaireQuestionDto } from "~/features/investor-profile/contracts/investor-profile.dto";
import QuestionnaireStepCard from "./QuestionnaireStepCard.vue";

const SAMPLE_QUESTION: QuestionnaireQuestionDto = {
  id: 1,
  text: "Qual o seu principal objetivo ao investir?",
  options: [
    { id: 1, text: "Preservar meu patrimônio", points: 1 },
    { id: 2, text: "Crescimento moderado", points: 2 },
    { id: 3, text: "Maximizar a rentabilidade", points: 3 },
  ],
};

const meta: Meta<typeof QuestionnaireStepCard> = {
  title: "Features/InvestorProfile/QuestionnaireStepCard",
  component: QuestionnaireStepCard,
  tags: ["autodocs"],
  argTypes: {
    selectedOptionId: { control: { type: "number" } },
    stepIndex: { control: { type: "number", min: 1 } },
    totalSteps: { control: { type: "number", min: 1 } },
  },
};

export default meta;

type Story = StoryObj<typeof QuestionnaireStepCard>;

export const NoSelection: Story = {
  args: {
    question: SAMPLE_QUESTION,
    selectedOptionId: null,
    stepIndex: 1,
    totalSteps: 5,
  },
};

export const WithSelection: Story = {
  args: {
    question: SAMPLE_QUESTION,
    selectedOptionId: 2,
    stepIndex: 1,
    totalSteps: 5,
  },
};

export const MiddleStep: Story = {
  args: {
    question: SAMPLE_QUESTION,
    selectedOptionId: null,
    stepIndex: 3,
    totalSteps: 5,
  },
};

export const LastStep: Story = {
  args: {
    question: SAMPLE_QUESTION,
    selectedOptionId: 1,
    stepIndex: 5,
    totalSteps: 5,
  },
};
