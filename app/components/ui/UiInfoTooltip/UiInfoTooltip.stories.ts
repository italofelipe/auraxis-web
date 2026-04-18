import type { Meta, StoryObj } from "@storybook/vue3";

import UiInfoTooltip from "./UiInfoTooltip.vue";

const meta: Meta<typeof UiInfoTooltip> = {
  title: "Design System/UiInfoTooltip",
  component: UiInfoTooltip,
  tags: ["autodocs"],
  argTypes: {
    content: { control: "text" },
    label: { control: "text" },
    placement: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof UiInfoTooltip>;

export const Default: Story = {
  args: {
    label: "Entender valor presente",
    content:
      "Valor presente mostra quanto o parcelamento realmente pesa hoje quando consideramos o tempo e a taxa informada.",
    placement: "top",
  },
  render: (args) => ({
    components: { UiInfoTooltip },
    setup: () => ({ args }),
    template: `
      <div style="padding: 48px; background: #05070d;">
        <UiInfoTooltip v-bind="args" />
      </div>
    `,
  }),
};
