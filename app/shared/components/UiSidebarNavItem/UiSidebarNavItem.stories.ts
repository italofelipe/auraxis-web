import type { Meta, StoryObj } from "@storybook/vue3";
import type { Component } from "vue";
import { LayoutDashboard, Wallet, Settings, BarChart2 } from "lucide-vue-next";
import UiSidebarNavItem from "./UiSidebarNavItem.vue";

const meta: Meta<typeof UiSidebarNavItem> = {
  title: "Shared/UiSidebarNavItem",
  component: UiSidebarNavItem,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
  },
  argTypes: {
    label: { control: "text" },
    to: { control: "text" },
    active: { control: "boolean" },
    collapsed: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof UiSidebarNavItem>;

export const Default: Story = {
  args: {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    active: false,
    collapsed: false,
  },
};

export const Active: Story = {
  args: {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    active: true,
    collapsed: false,
  },
};

export const Collapsed: Story = {
  args: {
    label: "Carteira",
    to: "/carteira",
    icon: Wallet,
    active: false,
    collapsed: true,
  },
};

export const CollapsedActive: Story = {
  args: {
    label: "Carteira",
    to: "/carteira",
    icon: Wallet,
    active: true,
    collapsed: true,
  },
};

export const WithoutIcon: Story = {
  args: {
    label: "Ferramentas",
    to: "/ferramentas",
    active: false,
    collapsed: false,
  },
};

export const AllItems: Story = {
  render: () => ({
    components: { UiSidebarNavItem },
    setup(): { LayoutDashboard: Component; Wallet: Component; BarChart2: Component; Settings: Component } {
      return { LayoutDashboard, Wallet, BarChart2, Settings };
    },
    template: `
      <div style="width: 220px; background: var(--color-surface-elevated, #1a1a2e); padding: 8px 0;">
        <UiSidebarNavItem label="Dashboard" to="/dashboard" :icon="LayoutDashboard" :active="true" />
        <UiSidebarNavItem label="Carteira" to="/carteira" :icon="Wallet" />
        <UiSidebarNavItem label="Análises" to="/analises" :icon="BarChart2" />
        <UiSidebarNavItem label="Configurações" to="/configuracoes" :icon="Settings" />
      </div>
    `,
  }),
};
