import type { Meta, StoryObj } from "@storybook/vue3";
import ToolCard from "./ToolCard.vue";
import type { Tool } from "~/features/tools/model/tools";

const meta: Meta<typeof ToolCard> = {
  title: "Features/Tools/ToolCard",
  component: ToolCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Card displaying a single tool with access level badge and navigation CTA.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolCard>;

const publicTool: Tool = {
  id: "juros-compostos",
  name: "Juros Compostos",
  description: "Calcule o rendimento dos seus investimentos com juros compostos.",
  enabled: true,
  accessLevel: "public",
  route: "/tools/juros-compostos",
};

export const PublicGuest: Story = {
  name: "Public tool — guest user",
  args: { tool: publicTool, isAuthenticated: false },
};

export const PublicAuthenticated: Story = {
  name: "Public tool — authenticated user",
  args: { tool: publicTool, isAuthenticated: true },
};

export const PremiumFreeUser: Story = {
  name: "Premium tool — free user",
  args: {
    tool: { ...publicTool, id: "simulator", name: "Simulador Avançado", accessLevel: "premium" as const },
    isAuthenticated: true,
    isPremium: false,
  },
};

export const PremiumUser: Story = {
  name: "Premium tool — premium user",
  args: {
    tool: { ...publicTool, id: "simulator", name: "Simulador Avançado", accessLevel: "premium" as const },
    isAuthenticated: true,
    isPremium: true,
  },
};

export const Disabled: Story = {
  name: "Disabled (Coming Soon)",
  args: {
    tool: { ...publicTool, enabled: false, name: "Em breve" },
    isAuthenticated: false,
  },
};
