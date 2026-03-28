import type { Meta, StoryObj } from "@storybook/vue3";
import {
  LayoutDashboard,
  Wallet,
  Target,
  Wrench,
  ArrowRightLeft,
} from "lucide-vue-next";
import UiAppShell from "./UiAppShell.vue";

const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  { key: "wallet", label: "Carteira", to: "/carteira", icon: Wallet },
  { key: "goals", label: "Metas", to: "/metas", icon: Target },
  { key: "tools", label: "Ferramentas", to: "/ferramentas", icon: Wrench },
  {
    key: "transactions",
    label: "Transações",
    to: "/transacoes",
    icon: ArrowRightLeft,
  },
];

const user = {
  name: "João Silva",
  description: "Investidor Moderado",
};

const meta: Meta<typeof UiAppShell> = {
  title: "Layout/UiAppShell",
  component: UiAppShell,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof UiAppShell>;

export const Default: Story = {
  args: {
    navItems,
    user,
    pageTitle: "Dashboard",
    pageSubtitle: "Dezembro 2025",
    topbarActions: [],
  },
  render: (args) => ({
    components: { UiAppShell },
    setup(): { args: typeof args } {
      return { args };
    },
    template: `
      <UiAppShell v-bind="args">
        <div style="padding: 24px; color: var(--color-text-secondary)">
          Conteúdo da página aqui
        </div>
      </UiAppShell>
    `,
  }),
};

export const WithActions: Story = {
  args: {
    ...Default.args,
    topbarActions: [
      { key: "add-income", label: "Receita", variant: "positive" },
      { key: "add-expense", label: "Despesa", variant: "negative" },
    ],
  },
  render: Default.render,
};
