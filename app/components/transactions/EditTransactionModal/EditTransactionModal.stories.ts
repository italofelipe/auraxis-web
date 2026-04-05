import type { Meta, StoryObj } from "@storybook/vue3";
import EditTransactionModal from "./EditTransactionModal.vue";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

const sampleTransaction: TransactionDto = {
  id: "txn-001",
  title: "Salário março",
  amount: "5000.00",
  type: "income",
  due_date: "2026-03-31",
  status: "paid",
  currency: "BRL",
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  installment_group_id: null,
  description: "Salário mensal",
  observation: null,
  start_date: null,
  end_date: null,
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  paid_at: "2026-03-31",
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-31T10:00:00Z",
};

const sampleExpense: TransactionDto = {
  id: "txn-002",
  title: "Aluguel",
  amount: "1800.00",
  type: "expense",
  due_date: "2026-04-05",
  status: "pending",
  currency: "BRL",
  is_recurring: true,
  is_installment: false,
  installment_count: null,
  installment_group_id: null,
  description: "Aluguel mensal",
  observation: null,
  start_date: "2026-01-05",
  end_date: "2026-12-05",
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  paid_at: null,
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-04-01T10:00:00Z",
};

const meta: Meta<typeof EditTransactionModal> = {
  title: "Transactions/EditTransactionModal",
  component: EditTransactionModal,
  tags: ["autodocs"],
  argTypes: {
    visible: { control: "boolean" },
  },
};

export default meta;

type Story = StoryObj<typeof EditTransactionModal>;

export const EditIncome: Story = {
  args: {
    visible: true,
    transaction: sampleTransaction,
  },
};

export const EditRecurringExpense: Story = {
  args: {
    visible: true,
    transaction: sampleExpense,
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    transaction: null,
  },
};
