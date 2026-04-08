<script setup lang="ts">
import type { EChartsOption } from "echarts";
import type { DashboardExpenseCategory } from "~/features/dashboard/model/dashboard-overview";
import { formatCurrency } from "~/utils/currency";

/** Props */
const props = withDefaults(
	defineProps<{
		/** List of expense categories with amount and percentage from the dashboard overview. */
		categories: DashboardExpenseCategory[];
		/** Whether the parent query is still loading. */
		loading?: boolean;
	}>(),
	{
		loading: false,
	},
);

/** Top 5 expense categories sorted by amount descending. */
const top5 = computed((): DashboardExpenseCategory[] => props.categories.slice(0, 5));

/**
 * Builds the ECharts option for the horizontal bar chart of top expense categories.
 *
 * @returns EChartsOption configured for a horizontal bar chart.
 */
const chartOption = computed((): EChartsOption => ({
	grid: { left: "3%", right: "10%", containLabel: true },
	tooltip: {
		trigger: "axis",
		formatter: (params: unknown): string => {
			const p = (Array.isArray(params) ? params[0] : params) as {
				name: string;
				value: number;
			};
			return `${p.name}: ${formatCurrency(p.value)}`;
		},
	},
	xAxis: {
		type: "value",
		axisLabel: {
			formatter: (v: number) => formatCurrency(v),
			fontSize: 10,
		},
		splitLine: { lineStyle: { type: "dashed" } },
	},
	yAxis: {
		type: "category",
		data: top5.value.map((c) => c.category),
		axisLabel: { fontSize: 11 },
		axisTick: { show: false },
	},
	series: [
		{
			type: "bar",
			data: top5.value.map((c) => c.amount),
			itemStyle: { color: "var(--color-brand-600)" },
			label: {
				show: true,
				position: "right",
				formatter: (params: unknown): string => {
					const p = params as { dataIndex: number };
					return `${(top5.value[p.dataIndex]?.percentage ?? 0).toFixed(1)}%`;
				},
				fontSize: 11,
			},
		},
	],
}));
</script>

<template>
	<UiChartPanel
		title="Top categorias de despesas"
		subtitle="Top 5 categorias do período"
		chart-height="240px"
		:loading="props.loading"
	>
		<template v-if="!props.loading">
			<p
				v-if="top5.length === 0"
				class="categories-empty"
			>
				Sem dados de categorias para o período
			</p>
			<UiChart
				v-else
				:option="chartOption"
				:update-key="top5.length"
				height="240px"
			/>
		</template>
	</UiChartPanel>
</template>

<style scoped>
.categories-empty {
	margin: 0;
	color: var(--color-text-muted);
	font-size: var(--font-size-sm);
	text-align: center;
	padding: var(--space-4) 0;
}
</style>
