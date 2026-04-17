import type { Meta, StoryObj } from "@storybook/vue3";
import ToolsEmptyState from "./ToolsEmptyState.vue";

const meta: Meta<typeof ToolsEmptyState> = {
  title: "Features/Tools/ToolsEmptyState",
  component: ToolsEmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Empty state shown when tool search/filter returns no results.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolsEmptyState>;

export const Default: Story = {};
