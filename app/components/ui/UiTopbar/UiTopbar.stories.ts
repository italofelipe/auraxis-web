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

/**
 * Mobile two-tier header (#981): at <=768px the header stacks into two rows.
 * Row 1: hamburger + (smaller) title/subtitle + theme toggle + avatar.
 * Row 2: the full Premium badge (slotted via #extras), left-aligned full-width.
 */
export const MobileTwoTier: Story = {
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
  args: {
    title: "Dashboard",
    subtitle: "Mês de Dezembro",
    userName: "João Silva",
    userDescription: "Investidor Arrojado",
    userAvatarUrl: "https://i.pravatar.cc/40?img=3",
    showMenuButton: true,
  },
  render: (args) => ({
    components: { UiTopbar },
    setup(): { args: typeof args } {
      return { args };
    },
    template: `
      <UiTopbar v-bind="args">
        <template #extras>
          <span
            style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:var(--color-warning-bg, #fef3c7);color:var(--color-warning, #b45309);font-size:var(--font-size-sm);font-weight:600;"
          >
            ⭐ Premium
          </span>
        </template>
      </UiTopbar>
    `,
  }),
};
