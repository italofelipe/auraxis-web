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
 */
import type { EChartsOption } from "echarts";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart, PieChart, GaugeChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { useChartTheme } from "~/composables/useChartTheme";

// Tree-shaking: registrar apenas os módulos utilizados
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
]);

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
    <VChart
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
