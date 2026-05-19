import type { Meta, StoryObj } from "@storybook/vue3";
import { defineComponent, ref } from "vue";
import { NButton, NCard, NDataTable, NFormItem, NInput, NSelect, NSpace, NSwitch, NTag } from "naive-ui";
import { themePalettes } from "~/theme/tokens/semantic";

const swatches = [
  ["Ação", "action.primary"],
  ["Receita", "feedback.positive"],
  ["Despesa", "feedback.negative"],
  ["Alerta", "feedback.warning"],
  ["Investimento", "chart.investment"],
] as const;

const tableColumns = [
  { title: "Componente", key: "component" },
  { title: "Estado", key: "state" },
  { title: "Token", key: "token" },
];

const tableData = [
  { component: "Button", state: "primary", token: "action.primary" },
  { component: "Input", state: "focus", token: "border.focus" },
  { component: "Select", state: "active", token: "action.primarySubtle" },
];

/**
 * Reads a nested token value from the semantic palette.
 * @param path Dot-separated token path.
 * @returns Token color from the light palette for swatch documentation.
 */
function getLightToken(path: string): string {
  return path.split(".").reduce<unknown>((value, key) => {
    return typeof value === "object" && value !== null && key in value
      ? (value as Record<string, unknown>)[key]
      : undefined;
  }, themePalettes.light) as string;
}

const swatchRows = swatches.map(([label, path]) => ({
  label,
  path,
  color: getLightToken(path),
}));

const TokensShowcase = defineComponent({
  name: "TokensShowcase",
  components: { NButton, NCard, NDataTable, NFormItem, NInput, NSelect, NSpace, NSwitch, NTag },
  setup() {
    const selected = ref("all");
    const enabled = ref(true);

    return { enabled, selected, swatchRows, tableColumns, tableData };
  },
  template: `
    <div style="display:grid;gap:16px;width:min(920px,calc(100vw - 48px));">
      <NCard title="Auraxis Theme Sandbox" bordered>
        <p style="margin:0 0 16px;color:var(--color-text-secondary);">
          Validação visual dos componentes base do Naive UI usando os mesmos overrides do app.
        </p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:12px;">
          <div
            v-for="swatch in swatchRows"
            :key="swatch.path"
            style="border:1px solid var(--color-outline-soft);border-radius:12px;padding:12px;background:var(--color-bg-elevated);"
          >
            <div
              :style="{ background: swatch.color }"
              style="height:40px;border-radius:10px;border:1px solid var(--color-outline-soft);margin-bottom:8px;"
            />
            <strong style="display:block;color:var(--color-text-primary);">{{ swatch.label }}</strong>
            <small style="color:var(--color-text-muted);">{{ swatch.path }}</small>
          </div>
        </div>
      </NCard>

      <NCard title="Naive UI controls" bordered>
        <NSpace vertical :size="16">
          <NSpace wrap>
            <NButton type="primary">Primary CTA</NButton>
            <NButton type="default">Default</NButton>
            <NButton type="error">Error</NButton>
            <NButton type="success">Success</NButton>
          </NSpace>

          <NFormItem label="Campo de busca">
            <NInput placeholder="Digite para testar foco e placeholder" />
          </NFormItem>

          <NFormItem label="Filtro">
            <NSelect
              v-model:value="selected"
              :options="[
                { label: 'Todos', value: 'all' },
                { label: 'Receitas', value: 'income' },
                { label: 'Despesas', value: 'expense' },
              ]"
            />
          </NFormItem>

          <NSpace align="center">
            <NSwitch v-model:value="enabled" />
            <NTag type="info" bordered>Tokenizado</NTag>
            <NTag type="success" bordered>Receita</NTag>
            <NTag type="error" bordered>Despesa</NTag>
          </NSpace>

          <NDataTable
            :columns="tableColumns"
            :data="tableData"
            :pagination="false"
            size="small"
          />
        </NSpace>
      </NCard>
    </div>
  `,
});

const meta: Meta = {
  title: "Design System/Theme Sandbox",
  component: TokensShowcase,
  tags: ["autodocs"],
};

export default meta;

export const Default: StoryObj = {
  render: () => ({
    components: { TokensShowcase },
    template: "<TokensShowcase />",
  }),
};
