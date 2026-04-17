import type { Meta, StoryObj } from "@storybook/vue3";
import { ref } from "vue";
import DashboardPeriodSelector from "./DashboardPeriodSelector.vue";
import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";

const meta: Meta<typeof DashboardPeriodSelector> = {
  title: "Features/Dashboard/DashboardPeriodSelector",
  component: DashboardPeriodSelector,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Button group for selecting the dashboard time period (e.g. 1M, 3M, 6M, 1Y).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardPeriodSelector>;

export const Default: Story = {
  render: () => ({
    components: { DashboardPeriodSelector },
    setup(): { period: ReturnType<typeof ref<DashboardPeriod>> } {
      const period = ref<DashboardPeriod>("3m");
      return { period };
    },
    template: "<DashboardPeriodSelector v-model=\"period\" />",
  }),
};
