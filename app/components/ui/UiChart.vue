<script setup lang="ts">
/**
 * UiChart — wrapper único de visualização de dados do Auraxis Web.
 *
 * Responsabilidades:
 * - Aplicar o tema Auraxis ao ECharts (via useChartTheme)
 * - Suportar SSR/CSR corretamente (ECharts requer DOM — client-only)
 * - Expor API de resize automático
 * - Ser extensível via prop `option` (EChartsOption completo)
 *
 * NÃO tem lógica de negócio — apenas renderização.
 *
 * PERFORMANCE: ECharts modules are lazy-loaded via defineAsyncComponent.
 * The ~800 KB echarts bundle is only fetched when a chart is first rendered,
 * keeping the initial page load lean.
 */
import type { EChartsOption } from "echarts";
import { defineAsyncComponent } from "vue";
import { useChartTheme } from "~/composables/useChartTheme";

/**
 * Lazy-loaded VChart — dynamically imports echarts core, renderers, charts,
 * components and vue-echarts. Registration via `use()` runs once inside the
 * factory (defineAsyncComponent caches the resolved component).
 */
const LazyVChart = defineAsyncComponent(async () => {
  const [{ use }, { CanvasRenderer }, charts, components, vueEcharts] =
    await Promise.all([
      import("echarts/core"),
      import("echarts/renderers"),
      import("echarts/charts"),
      import("echarts/components"),
      import("vue-echarts"),
    ]);

  use([
    CanvasRenderer,
    charts.LineChart,
    charts.BarChart,
    charts.PieChart,
    charts.GaugeChart,
    components.GridComponent,
    components.TooltipComponent,
    components.LegendComponent,
    components.TitleComponent,
    components.DataZoomComponent,
  ]);

  return vueEcharts.default;
});

const props = withDefaults(
  defineProps<{
    /** Configuração completa do ECharts — mesma API do EChartsOption */
    option: EChartsOption
    /** Altura do container. Padrão: 300px */
    height?: string
    /** Largura do container. Padrão: 100% */
    width?: string
    /** Habilitar auto-resize ao redimensionar a janela */
    autoresize?: boolean
    /** Chave para forçar re-render quando option muda profundamente */
    updateKey?: string | number
  }>(),
  {
    height: "300px",
    width: "100%",
    autoresize: true,
    updateKey: undefined,
  }
);

const { auraxisEChartsTheme } = useChartTheme();
</script>

<template>
  <ClientOnly>
    <LazyVChart
      :key="props.updateKey"
      :option="props.option"
      :theme="auraxisEChartsTheme"
      :autoresize="props.autoresize"
      :style="{ height: props.height, width: props.width }"
      class="ui-chart"
    />
    <template #fallback>
      <div
        class="ui-chart ui-chart--skeleton"
        :style="{ height: props.height, width: props.width }"
        aria-hidden="true"
      />
    </template>
  </ClientOnly>
</template>

<style scoped>
.ui-chart {
  display: block;
}

.ui-chart--skeleton {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
</style>
