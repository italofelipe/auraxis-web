import type { Meta, StoryObj } from "@storybook/vue3";
import UiPageHeader from "./UiPageHeader.vue";

const meta: Meta<typeof UiPageHeader> = {
  title: "Shared/UiPageHeader",
  component: UiPageHeader,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiPageHeader>

export const WithTitle: Story = {
  args: {
    title: "Dashboard",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Mês de Dezembro",
  },
};

export const LongTitle: Story = {
  args: {
    title: "Relatório de Transações Financeiras",
    subtitle: "Janeiro a Dezembro de 2024",
  },
};
