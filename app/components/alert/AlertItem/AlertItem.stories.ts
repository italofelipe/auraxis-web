import type { Meta, StoryObj } from "@storybook/vue3";
import AlertItem from "./AlertItem.vue";
import type { Alert } from "~/features/alerts/model/alerts";

const meta: Meta<typeof AlertItem> = {
  title: "Features/Alerts/AlertItem",
  component: AlertItem,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Row component for a single alert. Displays type tag, title, body, relative timestamp, and action buttons.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AlertItem>;

const baseAlert: Alert = {
  id: "alert-001",
  type: "goal_achieved",
  title: "Meta atingida: Reserva de emergência",
  body: "Parabéns! Você atingiu 100% da sua meta de reserva de emergência de R$ 30.000.",
  severity: "info",
  readAt: null,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
      body: "Os termos de uso e política de privacidade foram atualizados.",
      severity: "info",
      readAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    } satisfies Alert,
  },
};

export const OverduePayment: Story = {
  name: "Unread — Overdue Payment",
  args: {
    alert: {
      id: "alert-003",
      type: "overdue_payment",
      title: "Pagamento atrasado: Fatura cartão de crédito",
      body: "A fatura do seu cartão no valor de R$ 1.250,00 está atrasada há 3 dias.",
      severity: "warning",
      readAt: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    } satisfies Alert,
  },
};

export const BudgetExceeded: Story = {
  name: "Read — Budget Exceeded",
  args: {
    alert: {
      id: "alert-005",
      type: "budget_exceeded",
      title: "Orçamento excedido: Alimentação",
      body: "Você já gastou R$ 1.850,00 em alimentação este mês, ultrapassando o limite de R$ 1.500,00.",
      severity: "warning",
      readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    } satisfies Alert,
  },
};

export const InvestmentOpportunity: Story = {
  name: "Unread — Investment Opportunity",
  args: {
    alert: {
      id: "alert-006",
      type: "investment_opportunity",
      title: "Oportunidade de investimento: CDB 14,5% ao ano",
      body: "Um novo CDB com liquidez diária e taxa de 14,5% ao ano está disponível na sua corretora.",
      severity: "info",
      readAt: null,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    } satisfies Alert,
  },
};
