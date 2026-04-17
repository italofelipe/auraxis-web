import type { Meta, StoryObj } from "@storybook/vue3";
import BaseCard from "./BaseCard.vue";

const meta: Meta<typeof BaseCard> = {
  title: "Design System/BaseCard",
  component: BaseCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Generic surface card with optional title header and default slot for content.",
      },
    },
  },
  argTypes: {
    title: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof BaseCard>;

export const WithTitle: Story = {
  args: { title: "Resumo Financeiro" },
  render: (args) => ({
    components: { BaseCard },
    setup(): { args: typeof args } { return { args }; },
    template: "<BaseCard v-bind=\"args\"><p>Conteúdo do card aqui.</p></BaseCard>",
  }),
};

export const WithoutTitle: Story = {
  args: {},
  render: () => ({
    components: { BaseCard },
    template: "<BaseCard><p>Card sem título — conteúdo direto.</p></BaseCard>",
  }),
};
