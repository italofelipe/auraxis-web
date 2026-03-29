import type { Meta, StoryObj } from "@storybook/vue3";
import ToolCatalogCard from "./ToolCatalogCard.vue";
import type { Tool } from "~/features/tools/model/tools";

const meta: Meta<typeof ToolCatalogCard> = {
  title: "Features/Tools/ToolCatalogCard",
  component: ToolCatalogCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Card displaying a single tool from the catalog with access badge and a CTA button that navigates to the tool page.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ToolCatalogCard>;

const publicTool: Tool = {
  id: "installment-vs-cash",
  name: "Parcelado vs À Vista",
  description:
    "Compare se vale mais a pena pagar à vista ou parcelado, considerando taxa de oportunidade e inflação.",
  enabled: true,
  accessLevel: "public",
  route: "/tools/installment-vs-cash",
};

const authTool: Tool = {
  id: "budget-planner",
  name: "Planejamento de Orçamento",
  description:
    "Organize suas finanças mensais com categorias personalizadas e alertas de limite.",
  enabled: true,
  accessLevel: "authenticated",
  route: "/tools/budget-planner",
};

const premiumTool: Tool = {
  id: "advanced-simulator",
  name: "Simulador Avançado",
  description:
    "Simulações financeiras avançadas com múltiplos cenários, análise de risco e relatórios exportáveis.",
  enabled: true,
  accessLevel: "premium",
  route: "/tools/advanced-simulator",
};

const disabledTool: Tool = {
  id: "tax-optimizer",
  name: "Otimizador de IR",
  description: "Planejamento tributário e simulação de imposto de renda.",
  enabled: false,
  accessLevel: "public",
  route: "/tools/tax-optimizer",
};

export const PublicAccess: Story = {
  name: "Public Access",
  args: {
    tool: publicTool,
  },
};

export const AuthenticatedAccess: Story = {
  name: "Authenticated (Free) Access",
  args: {
    tool: authTool,
  },
};

export const PremiumAccess: Story = {
  name: "Premium Access",
  args: {
    tool: premiumTool,
  },
};

export const Disabled: Story = {
  name: "Disabled (Coming Soon)",
  args: {
    tool: disabledTool,
  },
};
