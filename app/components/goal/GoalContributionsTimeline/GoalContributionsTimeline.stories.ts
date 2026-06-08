import type { Meta, StoryObj } from "@storybook/vue3";

import GoalContributionsTimeline from "./GoalContributionsTimeline.vue";
import type { GoalContributionDto } from "~/features/goals/contracts/contributions.dto";

const meta: Meta<typeof GoalContributionsTimeline> = {
  title: "Features/Goals/GoalContributionsTimeline",
  component: GoalContributionsTimeline,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Timeline of a goal's contributions (deposits and withdrawals), newest first, with empty, loading and error states.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof GoalContributionsTimeline>;

const items: GoalContributionDto[] = [
  {
    id: "c-1",
    goal_id: "goal-001",
    amount: 250,
    note: "Aporte mensal",
    occurred_at: "2026-06-01",
    created_at: "2026-06-01T10:00:00Z",
  },
  {
    id: "c-2",
    goal_id: "goal-001",
    amount: -80,
    note: "Imprevisto",
    occurred_at: "2026-05-22",
    created_at: "2026-05-22T10:00:00Z",
  },
  {
    id: "c-3",
    goal_id: "goal-001",
    amount: 1000,
    note: null,
    occurred_at: "2026-05-05",
    created_at: "2026-05-05T10:00:00Z",
  },
];

export const WithItems: Story = {
  args: { items },
};

export const Empty: Story = {
  args: { items: [] },
};

export const Loading: Story = {
  args: { loading: true },
};

export const ErrorState: Story = {
  args: { error: true },
};
