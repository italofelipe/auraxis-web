import type { Meta, StoryObj } from "@storybook/vue3";
import {
  Calculator,
  BarChart2,
  Briefcase,
  Home,
  TrendingUp,
} from "lucide-vue-next";
import UiToolsShell from "./UiToolsShell.vue";

const toolsNavItems = [
  { key: "clt", label: "Ferramentas CLT", to: "/tools/clt", icon: Briefcase },
  {
    key: "investimentos",
    label: "Investimentos",
    to: "/tools/investimentos",
    icon: TrendingUp,
  },
  {
    key: "imoveis",
    label: "Imóveis",
    to: "/tools/imoveis",
    icon: Home,
  },
  {
    key: "calculadoras",
    label: "Calculadoras Gerais",
    to: "/tools",
    icon: Calculator,
  },
  {
    key: "relatorios",
    label: "Relatórios",
    to: "/tools/relatorios",
    icon: BarChart2,
  },
];

const meta: Meta<typeof UiToolsShell> = {
  title: "Layout/UiToolsShell",
  component: UiToolsShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
**UiToolsShell** é o container de layout exclusivo da suíte de ferramentas (Finance Hub).

Diferenças em relação a **UiAppShell**:
- Sem topbar de usuário (tools é acessível sem auth completo)
- Botão de colapso embutido no header da sidebar
- Slot \`sidebar-footer\` para bloco de upgrade/upsell

**Slots:**
- \`default\` — área de conteúdo principal
- \`sidebar-footer\` — bloco opcional no rodapé da sidebar (ex: \`UiUpgradePrompt\`)
        `.trim(),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UiToolsShell>;

/** Estado padrão — sidebar expandida com itens de navegação. */
export const Default: Story = {
  args: {
    navItems: toolsNavItems,
  },
  render: (args) => ({
    components: { UiToolsShell },
    setup(): { args: typeof args } {
      return { args };
    },
    template: `
      <UiToolsShell v-bind="args">
        <div style="padding:24px">
          <h2 style="color:var(--color-text-primary);margin:0 0 8px">Calculadora de Hora Extra CLT</h2>
          <p style="color:var(--color-text-secondary);margin:0">
            Conteúdo da ferramenta renderizado aqui via slot padrão.
          </p>
        </div>
      </UiToolsShell>
    `,
  }),
};

/** Com bloco de upgrade no rodapé da sidebar. */
export const WithSidebarFooter: Story = {
  args: {
    navItems: toolsNavItems,
  },
  render: (args) => ({
    components: { UiToolsShell },
    setup(): { args: typeof args } {
      return { args };
    },
    template: `
      <UiToolsShell v-bind="args">
        <template #sidebar-footer>
          <div style="text-align:center;padding:8px 0">
            <p style="margin:0 0 8px;font-size:12px;color:var(--color-text-secondary)">
              🔒 Recurso Premium
            </p>
            <button style="width:100%;padding:8px;background:var(--color-brand-600);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">
              Ver planos
            </button>
          </div>
        </template>

        <div style="padding:24px">
          <h2 style="color:var(--color-text-primary);margin:0 0 8px">Simulador de Férias CLT</h2>
          <p style="color:var(--color-text-secondary);margin:0">
            Conteúdo bloqueado por paywall.
          </p>
        </div>
      </UiToolsShell>
    `,
  }),
};

/** Sem itens de navegação — sidebar vazia. */
export const EmptyNav: Story = {
  args: {
    navItems: [],
  },
  render: (args) => ({
    components: { UiToolsShell },
    setup(): { args: typeof args } {
      return { args };
    },
    template: `
      <UiToolsShell v-bind="args">
        <div style="padding:24px;color:var(--color-text-secondary)">
          Shell sem navegação definida.
        </div>
      </UiToolsShell>
    `,
  }),
};
