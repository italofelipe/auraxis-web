import type { Meta, StoryObj } from "@storybook/vue3";

import ResetPasswordForm from "./ResetPasswordForm.vue";

const meta: Meta<typeof ResetPasswordForm> = {
  title: "Auth/ResetPasswordForm",
  component: ResetPasswordForm,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Second step of the recovery flow. Mirrors ForgotPasswordForm: glass card, gradient CTA and visible password toggles.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResetPasswordForm>;

export const Default: Story = {};

export const Submitting: Story = {
  args: { loading: true },
};

export const WithServerError: Story = {
  args: {
    serverError: "Este link expirou. Peça um novo para continuar.",
  },
};
