import type { Meta, StoryObj } from "@storybook/vue3";
import UiInlineError from "./UiInlineError.vue";

const meta: Meta<typeof UiInlineError> = {
  title: "UI/UiInlineError",
  component: UiInlineError,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    message: { control: "text" },
    retryLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiInlineError>;

export const Default: Story = {
  args: {},
};

export const WithMessage: Story = {
  args: {
    title: "Erro ao carregar dados",
    message: "Verifique sua conexão e tente novamente.",
  },
};

export const WithRetry: Story = {
  args: {
    title: "Não foi possível carregar",
    message: "O servidor retornou um erro (503).",
    retryLabel: "Tentar novamente",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Falha ao buscar metas",
  },
};
