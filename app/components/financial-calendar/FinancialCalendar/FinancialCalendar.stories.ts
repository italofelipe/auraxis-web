import type { Meta, StoryObj } from "@storybook/vue3";
import FinancialCalendar from "./FinancialCalendar.vue";

/**
 * FinancialCalendar — monthly grid view of the user's financial activity.
 *
 * Fetches transactions for the displayed month and renders a 6×7 grid where
 * each day cell shows income/expense icons, the net daily balance, and
 * highlights "cash valleys" (3+ consecutive negative-balance days) in red.
 *
 * Clicking a cell emits `day-click` with the full CalendarDay data, intended
 * to open CalendarDayDetail.
 *
 * In Storybook this component requires a live API or MSW mock to render real data.
 */
const meta: Meta<typeof FinancialCalendar> = {
  title: "Features/FinancialCalendar/FinancialCalendar",
  component: FinancialCalendar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Monthly financial calendar grid. Requires API access (or MSW) to render real data.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FinancialCalendar>;

/** Default: current month (requires API). */
export const Default: Story = {
  name: "Current month (API required)",
  args: {},
};

/** With initial month override: April 2026. */
export const April2026: Story = {
  name: "April 2026",
  args: {
    initialYear: 2026,
    initialMonth: 3,
  },
};
