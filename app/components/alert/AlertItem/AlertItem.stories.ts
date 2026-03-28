import type { Meta, StoryObj } from "@storybook/vue3";
import AlertItem from "./AlertItem.vue";
import type { AlertDto } from "~/features/alerts/contracts/alert.dto";

const meta: Meta<typeof AlertItem> = {
  title: "Features/Alerts/AlertItem",
  component: AlertItem,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Row component for a single alert. Displays type tag, title, description, relative timestamp, and action buttons.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AlertItem>;

const baseAlert: AlertDto = {
  id: "alert-001",
  type: "goal_achieved",
  title: "Meta atingida: Reserva de emergência",
  description: "Parabéns! Você atingiu 100% da sua meta de reserva de emergência de R$ 30.000.",
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  is_read: false,
};

export const Unread: Story = {
  name: "Unread — Goal Achieved",
  args: {
    alert: baseAlert,
  },
};

export const Read: Story = {
  name: "Read — System",
  args: {
    alert: {
      id: "alert-007",
      type: "system",
      title: "Atualização de termos de uso",
      description: "Os termos de uso e política de privacidade foram atualizados.",
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      is_read: true,
    } satisfies AlertDto,
  },
};

export const OverduePayment: Story = {
  name: "Unread — Overdue Payment",
  args: {
    alert: {
      id: "alert-003",
      type: "overdue_payment",
      title: "Pagamento atrasado: Fatura cartão de crédito",
      description: "A fatura do seu cartão no valor de R$ 1.250,00 está atrasada há 3 dias.",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_read: false,
    } satisfies AlertDto,
  },
};

export const BudgetExceeded: Story = {
  name: "Read — Budget Exceeded",
  args: {
    alert: {
      id: "alert-005",
      type: "budget_exceeded",
      title: "Orçamento excedido: Alimentação",
      description: "Você já gastou R$ 1.850,00 em alimentação este mês, ultrapassando o limite de R$ 1.500,00.",
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      is_read: true,
    } satisfies AlertDto,
  },
};

export const InvestmentOpportunity: Story = {
  name: "Unread — Investment Opportunity",
  args: {
    alert: {
      id: "alert-006",
      type: "investment_opportunity",
      title: "Oportunidade de investimento: CDB 14,5% ao ano",
      description: "Um novo CDB com liquidez diária e taxa de 14,5% ao ano está disponível na sua corretora.",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      is_read: false,
    } satisfies AlertDto,
  },
};
