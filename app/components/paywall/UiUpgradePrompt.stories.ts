import type { Meta, StoryObj } from "@storybook/vue3";
import UiUpgradePrompt from "./UiUpgradePrompt.vue";

/** Args shape shared by all UiUpgradePrompt stories. */
interface UiUpgradePromptArgs {
  featureName?: string;
  description?: string;
  ctaLabel?: string;
}

const meta: Meta<typeof UiUpgradePrompt> = {
  title: "Design System/UiUpgradePrompt",
  component: UiUpgradePrompt,
  tags: ["autodocs"],
  argTypes: {
    featureName: { control: "text" },
    description: { control: "text" },
    ctaLabel: { control: "text" },
  },
  parameters: {
    docs: {
      description: {
        component: `
**UiUpgradePrompt** é o componente de upsell exibido quando o usuário não tem acesso a um recurso premium.

Tipicamente usado como conteúdo do slot \`locked\` do **UiPaywallGate**:

\`\`\`vue
<UiPaywallGate feature="advanced_simulations">
  <template #locked>
    <UiUpgradePrompt feature-name="Simulações Avançadas" />
  </template>
  <!-- conteúdo premium aqui -->
</UiPaywallGate>
\`\`\`
        `.trim(),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UiUpgradePrompt>;

/**
 * Estado padrão — usa textos do i18n sem customizações.
 */
export const Default: Story = {
  args: {},
  render: (args) => ({
    components: { UiUpgradePrompt },
    setup(): { args: UiUpgradePromptArgs } {
      return { args };
    },
    template: "<div style=\"width:360px\"><UiUpgradePrompt v-bind=\"args\" /></div>",
  }),
};

/**
 * Com nome do recurso — exibe o badge com o nome da funcionalidade bloqueada.
 */
export const WithFeatureName: Story = {
  args: {
    featureName: "Simulações Avançadas",
  },
  render: (args) => ({
    components: { UiUpgradePrompt },
    setup(): { args: UiUpgradePromptArgs } {
      return { args };
    },
    template: "<div style=\"width:360px\"><UiUpgradePrompt v-bind=\"args\" /></div>",
  }),
};

/**
 * Com descrição customizada — sobrescreve o texto padrão do i18n.
 */
export const CustomDescription: Story = {
  args: {
    featureName: "Exportação PDF",
    description: "Exporte seus relatórios em PDF com um clique. Disponível no plano Pro.",
    ctaLabel: "Conhecer o Pro",
  },
  render: (args) => ({
    components: { UiUpgradePrompt },
    setup(): { args: UiUpgradePromptArgs } {
      return { args };
    },
    template: "<div style=\"width:360px\"><UiUpgradePrompt v-bind=\"args\" /></div>",
  }),
};

/**
 * CLT vs PJ — contexto de ferramenta com badge de produto.
 */
export const CltVsPj: Story = {
  args: {
    featureName: "CLT vs PJ",
    description: "Compare o custo-benefício real entre regimes de contratação com análise detalhada.",
    ctaLabel: "Ver planos",
  },
  render: (args) => ({
    components: { UiUpgradePrompt },
    setup(): { args: UiUpgradePromptArgs } {
      return { args };
    },
    template: "<div style=\"width:360px\"><UiUpgradePrompt v-bind=\"args\" /></div>",
  }),
};
