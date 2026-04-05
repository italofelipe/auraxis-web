import type { Meta, StoryObj } from "@storybook/vue3";
import QuickTransactionForm from "./QuickTransactionForm.vue";

const meta: Meta<typeof QuickTransactionForm> = {
  title: "Transactions/QuickTransactionForm",
  component: QuickTransactionForm,
  tags: ["autodocs"],
  argTypes: {
    visible: { control: "boolean" },
    type: {
      control: "select",
      options: ["income", "expense"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof QuickTransactionForm>;

export const IncomeForm: Story = {
  args: {
    visible: true,
    type: "income",
  },
};

export const ExpenseForm: Story = {
  args: {
    visible: true,
    type: "expense",
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    type: "expense",
  },
};
