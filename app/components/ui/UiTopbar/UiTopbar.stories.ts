import { Plus, Minus } from "lucide-vue-next";
import type { Meta, StoryObj } from "@storybook/vue3";
import UiTopbar from "./UiTopbar.vue";

const meta: Meta<typeof UiTopbar> = {
  title: "Shared/UiTopbar",
  component: UiTopbar,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
    subtitle: { control: "text" },
    userName: { control: "text" },
    userDescription: { control: "text" },
    userAvatarUrl: { control: "text" },
    showMenuButton: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof UiTopbar>

export const WithActions: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Mês de Dezembro",
    userName: "João Silva",
    userDescription: "Investidor Arrojado",
    actions: [
      { key: "add-income", label: "Receita", icon: Plus, variant: "positive" },
      { key: "add-expense", label: "Despesa", icon: Minus, variant: "negative" },
    ],
  },
};

export const NoActions: Story = {
  args: {
    title: "Carteira",
    subtitle: "Visão geral",
    userName: "Maria Santos",
    userDescription: "Investidora Conservadora",
  },
};

export const WithMenuButton: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Mês de Dezembro",
    userName: "João Silva",
    userDescription: "Investidor Arrojado",
    showMenuButton: true,
    actions: [
      { key: "add-income", label: "Receita", icon: Plus, variant: "positive" },
      { key: "add-expense", label: "Despesa", icon: Minus, variant: "negative" },
    ],
  },
};

export const WithAvatar: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Mês de Dezembro",
    userName: "João Silva",
    userDescription: "Investidor Arrojado",
    userAvatarUrl: "https://i.pravatar.cc/40?img=3",
    actions: [
      { key: "add-income", label: "Receita", icon: Plus, variant: "positive" },
    ],
  },
};
