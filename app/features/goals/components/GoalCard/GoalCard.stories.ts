import type { Meta, StoryObj } from "@storybook/vue3";
import GoalCard from "./GoalCard.vue";
import type { GoalDto } from "../../contracts/goal.dto";

const meta: Meta<typeof GoalCard> = {
  title: "Features/Goals/GoalCard",
  component: GoalCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Card displaying a single financial goal with progress bar, status tag, and formatted currency statistics.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof GoalCard>;

const activeGoal: GoalDto = {
  id: "goal-001",
  name: "Reserva de emergência",
  description: "Manter 6 meses de despesas guardados em conta de liquidez diária.",
  target_amount: 30000,
  current_amount: 15000,
  target_date: "2026-09-30",
  status: "active",
  created_at: "2025-11-01T10:00:00Z",
};

export const Active: Story = {
  name: "Active (50% progress)",
  args: {
    goal: activeGoal,
  },
};

export const Completed: Story = {
  name: "Completed (100%)",
  args: {
    goal: {
      id: "goal-002",
      name: "Entrada do apartamento",
      description: "Dar entrada em imóvel de R$ 450.000 na Zona Sul.",
      target_amount: 90000,
      current_amount: 90000,
      target_date: "2025-10-31",
      status: "completed",
      created_at: "2023-03-01T08:00:00Z",
    } satisfies GoalDto,
  },
};

export const Paused: Story = {
  name: "Paused (30% progress)",
  args: {
    goal: {
      id: "goal-003",
      name: "Troca do carro",
      description: null,
      target_amount: 50000,
      current_amount: 15000,
      target_date: "2027-06-30",
      status: "paused",
      created_at: "2024-07-10T11:00:00Z",
    } satisfies GoalDto,
  },
};

export const Loading: Story = {
  args: {
    goal: activeGoal,
    loading: true,
  },
};

export const NearDeadline: Story = {
  name: "Near deadline (90% progress, target next week)",
  args: {
    goal: {
      id: "goal-004",
      name: "Notebook novo",
      description: "MacBook Pro M4 para trabalho e criação de conteúdo.",
      target_amount: 18000,
      current_amount: 16200,
      target_date: "2026-04-03",
      status: "active",
      created_at: "2026-01-05T09:00:00Z",
    } satisfies GoalDto,
  },
};
