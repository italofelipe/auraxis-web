import type { Meta, StoryObj } from "@storybook/vue3";
import GoalProjectionPanel from "./GoalProjectionPanel.vue";

/**
 * GoalProjectionPanel — composite panel that combines an interactive monthly
 * contribution slider with a compound-interest accumulation chart.
 *
 * Data is fetched from GET /goals/:id/projection and uses the authenticated
 * user's portfolio blended return rate to project balance growth over time.
 *
 * In Storybook this component requires a live API or MSW mock to render data.
 * The stories below exercise the goalId prop variations.
 */
const meta: Meta<typeof GoalProjectionPanel> = {
  title: "Features/Goals/GoalProjectionPanel",
  component: GoalProjectionPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Projection panel with interactive slider and ECharts accumulation curve." +
          " Requires API access (or MSW) — use goalId='goal-001' against a running backend.",
      },
    },
  },
  args: {
    goalId: "goal-001",
  },
  argTypes: {
    goalId: {
      control: "text",
      description: "Goal ID to fetch the projection for. Pass null to hide the panel.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof GoalProjectionPanel>;

/** Default: panel visible with a real goalId (requires API). */
export const Default: Story = {
  name: "With goalId (API required)",
  args: {
    goalId: "goal-001",
  },
};

/** Hidden: panel renders nothing when goalId is null. */
export const Hidden: Story = {
  name: "Hidden (goalId = null)",
  args: {
    goalId: null,
  },
};
