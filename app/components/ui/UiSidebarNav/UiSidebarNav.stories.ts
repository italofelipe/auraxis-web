import type { Meta, StoryObj } from "@storybook/vue3";
import { LayoutDashboard, Wallet, BarChart2, Settings, Bell } from "lucide-vue-next";
import UiSidebarNav from "./UiSidebarNav.vue";
import type { SidebarNavItem, UiSidebarNavProps } from "./UiSidebarNav.types";

const meta: Meta<typeof UiSidebarNav> = {
  title: "Shared/UiSidebarNav",
  component: UiSidebarNav,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark" },
  },
  argTypes: {
    collapsed: { control: "boolean" },
    currentRoute: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiSidebarNav>;

const navItems: SidebarNavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { key: "carteira", label: "Carteira", to: "/carteira", icon: Wallet },
  { key: "analises", label: "Análises", to: "/analises", icon: BarChart2 },
  { key: "alertas", label: "Alertas", to: "/alertas", icon: Bell },
  { key: "configuracoes", label: "Configurações", to: "/configuracoes", icon: Settings },
];

export const Default: Story = {
  args: {
    items: navItems,
    currentRoute: "/dashboard",
    collapsed: false,
  },
  render: (args) => ({
    components: { UiSidebarNav },
    setup(): { args: UiSidebarNavProps } {
      return { args };
    },
    template: `
      <div style="width: 220px; background: var(--color-surface-elevated, #1a1a2e); padding: 8px 0;">
        <UiSidebarNav v-bind="args" />
      </div>
    `,
  }),
};

export const ActiveOnCarteira: Story = {
  args: {
    items: navItems,
    currentRoute: "/carteira",
    collapsed: false,
  },
  render: (args) => ({
    components: { UiSidebarNav },
    setup(): { args: UiSidebarNavProps } {
      return { args };
    },
    template: `
      <div style="width: 220px; background: var(--color-surface-elevated, #1a1a2e); padding: 8px 0;">
        <UiSidebarNav v-bind="args" />
      </div>
    `,
  }),
};

export const Collapsed: Story = {
  args: {
    items: navItems,
    currentRoute: "/dashboard",
    collapsed: true,
  },
  render: (args) => ({
    components: { UiSidebarNav },
    setup(): { args: UiSidebarNavProps } {
      return { args };
    },
    template: `
      <div style="width: 64px; background: var(--color-surface-elevated, #1a1a2e); padding: 8px 0;">
        <UiSidebarNav v-bind="args" />
      </div>
    `,
  }),
};

export const NoActiveItem: Story = {
  args: {
    items: navItems,
    collapsed: false,
  },
  render: (args) => ({
    components: { UiSidebarNav },
    setup(): { args: UiSidebarNavProps } {
      return { args };
    },
    template: `
      <div style="width: 220px; background: var(--color-surface-elevated, #1a1a2e); padding: 8px 0;">
        <UiSidebarNav v-bind="args" />
      </div>
    `,
  }),
};

export const ActivePrefixMatch: Story = {
  args: {
    items: navItems,
    currentRoute: "/carteira/detalhe/btc",
    collapsed: false,
  },
  render: (args) => ({
    components: { UiSidebarNav },
    setup(): { args: UiSidebarNavProps } {
      return { args };
    },
    template: `
      <div style="width: 220px; background: var(--color-surface-elevated, #1a1a2e); padding: 8px 0;">
        <UiSidebarNav v-bind="args" />
      </div>
    `,
  }),
};
