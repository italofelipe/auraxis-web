<script setup lang="ts">
import type { EChartsOption } from "echarts";
import { computed } from "vue";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CreditCard,
  Gauge,
  PlusCircle,
  Tags,
  TrendingUp,
} from "lucide-vue-next";
import {
  NAlert,
  NButton,
  NEmpty,
  NSpin,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
} from "naive-ui";

import type {
  BillTransaction,
  CreditCardBill,
  CreditCardDto,
  CreditCardUtilization,
} from "~/features/credit-cards/contracts/credit-card.dto";
import { formatCurrency } from "~/utils/currency";

const props = defineProps<{
  card: CreditCardDto;
  bill: CreditCardBill | null;
  utilization: CreditCardUtilization | null;
  month: string;
  initialTab?: string;
  loading?: boolean;
  error?: boolean;
}>();

const emit = defineEmits<{
  addExpense: [];
  shiftMonth: [delta: number];
}>();

const brandLabel = computed<string>(() => props.card.brand?.toUpperCase() ?? "Cartão");
const limitAmount = computed<number>(() => props.card.limit_amount ?? 0);
const committedAmount = computed<number>(
  () => props.utilization?.committedAmount ?? props.bill?.totalAmount ?? 0,
);
const availableAmount = computed<number>(
  () => props.utilization?.availableAmount ?? Math.max(limitAmount.value - committedAmount.value, 0),
);
const utilizationPct = computed<number>(
  () => props.utilization?.utilizationPct ?? (
    limitAmount.value > 0 ? Math.round((committedAmount.value / limitAmount.value) * 100) : 0
  ),
);

const cardCycleLabel = computed<string>(() => {
  if (props.card.closing_day === null || props.card.due_day === null) {
    return "Ciclo não configurado";
  }
  return `Fecha dia ${props.card.closing_day} · vence dia ${props.card.due_day}`;
});

const billTransactions = computed<readonly BillTransaction[]>(
  () => props.bill?.transactions ?? [],
);

const isolatedAmount = computed<number>(() =>
  billTransactions.value
    .filter((tx) => tx.impactPolicy === "cards_only")
    .reduce((sum, tx) => sum + tx.amount, 0),
);

const plannedAmount = computed<number>(() =>
  billTransactions.value
    .filter((tx) => tx.impactPolicy === "planned_until_bill")
    .reduce((sum, tx) => sum + tx.amount, 0),
);

const pendingAmount = computed<number>(
  () => statusBuckets.value.find((bucket) => bucket.name === "pending")?.value ?? 0,
);

const budgetRiskLabel = computed<string>(() => {
  if (!props.bill) {
    return "Sem fatura carregada";
  }
  if (props.bill.pendingAmount > availableAmount.value) {
    return "Atenção: pendente maior que limite livre";
  }
  if (plannedAmount.value > 0) {
    return "Há compras planejadas até a fatura";
  }
  return "Risco controlado no ciclo atual";
});

const statusBuckets = computed<Array<{ name: string; value: number }>>(() => {
  const totals = new Map<string, number>();
  for (const tx of billTransactions.value) {
    totals.set(tx.status, (totals.get(tx.status) ?? 0) + tx.amount);
  }
  return [...totals.entries()].map(([name, value]) => ({ name, value }));
});

const categoryBuckets = computed<Array<{ name: string; value: number }>>(() => {
  const full = billTransactions.value
    .filter((tx) => tx.impactPolicy === "full")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const buckets = [
    { name: "Integrado", value: full },
    { name: "Só cartões", value: isolatedAmount.value },
    { name: "Planejado", value: plannedAmount.value },
  ];
  return buckets.filter((bucket) => bucket.value > 0);
});

const billEvolutionOption = computed((): EChartsOption => {
  const total = props.bill?.totalAmount ?? 0;
  const paid = props.bill?.paidAmount ?? 0;
  const pending = props.bill?.pendingAmount ?? 0;
  return {
    tooltip: { trigger: "axis" },
    grid: { left: 36, right: 16, top: 24, bottom: 28 },
    xAxis: { type: "category", data: ["Pago", "Pendente", "Total"] },
    yAxis: { type: "value" },
    series: [
      {
        type: "bar",
        data: [paid, pending, total],
        itemStyle: { borderRadius: 6 },
      },
    ],
  };
});

const categoryOption = computed((): EChartsOption => ({
  tooltip: { trigger: "item" },
  legend: { bottom: 0 },
  series: [
    {
      type: "pie",
      radius: ["46%", "72%"],
      data: categoryBuckets.value.length
        ? categoryBuckets.value
        : [{ name: "Sem lançamentos", value: 1 }],
    },
  ],
}));
</script>

<template>
  <section class="cc-dashboard" data-testid="cc-dashboard">
    <header class="cc-dashboard__hero">
      <div class="cc-dashboard__card-face">
        <span>{{ props.card.bank ?? brandLabel }}</span>
        <strong>{{ props.card.name }}</strong>
        <small>{{ cardCycleLabel }}</small>
      </div>
      <div class="cc-dashboard__hero-copy">
        <div>
          <p class="cc-dashboard__eyebrow">Dashboard de cartão</p>
          <h1>{{ props.card.name }}</h1>
          <p>{{ brandLabel }} · {{ props.card.last_four_digits ? `•••• ${props.card.last_four_digits}` : "final não informado" }}</p>
        </div>
        <NButton type="primary" @click="emit('addExpense')">
          <template #icon><PlusCircle :size="16" /></template>
          Lançar despesa
        </NButton>
      </div>
    </header>

    <section class="cc-dashboard__kpis">
      <NStatistic label="Fatura atual">
        {{ formatCurrency(props.bill?.totalAmount ?? 0) }}
      </NStatistic>
      <NStatistic label="Limite livre real">
        {{ formatCurrency(availableAmount) }}
      </NStatistic>
      <NStatistic label="Utilização">
        {{ Math.round(utilizationPct) }}%
      </NStatistic>
      <NStatistic label="Compras isoladas">
        {{ formatCurrency(isolatedAmount) }}
      </NStatistic>
    </section>

    <NAlert v-if="props.error" type="error" title="Não foi possível carregar a fatura" />
    <div v-else-if="props.loading" class="cc-dashboard__loading">
      <NSpin size="large" />
    </div>

    <NTabs
      v-else
      type="line"
      animated
      display-directive="show"
      :default-value="props.initialTab ?? 'overview'"
    >
      <NTabPane name="overview" tab="Visão geral">
        <section class="cc-dashboard__charts">
          <article class="cc-dashboard__panel">
            <header>
              <TrendingUp :size="18" />
              <span>Evolução da fatura</span>
            </header>
            <UiChart :option="billEvolutionOption" height="320px" />
          </article>
          <article class="cc-dashboard__panel">
            <header>
              <Tags :size="18" />
              <span>Gastos por categoria</span>
            </header>
            <UiChart :option="categoryOption" height="320px" />
          </article>
        </section>
      </NTabPane>

      <NTabPane name="bill" tab="Fatura">
        <div class="cc-dashboard__toolbar">
          <NButton size="small" @click="emit('shiftMonth', -1)">Anterior</NButton>
          <strong>{{ props.month }}</strong>
          <NButton size="small" @click="emit('shiftMonth', 1)">Próxima</NButton>
        </div>
        <NEmpty v-if="billTransactions.length === 0" description="Sem compras nessa fatura" />
        <ul v-else class="cc-dashboard__transactions">
          <li v-for="tx in billTransactions" :key="tx.id">
            <span>{{ tx.title }}</span>
            <NTag size="small" :bordered="false">{{ tx.status }}</NTag>
            <strong>{{ formatCurrency(tx.amount) }}</strong>
          </li>
        </ul>
      </NTabPane>

      <NTabPane name="categories" tab="Categorias">
        <section class="cc-dashboard__analytics-grid">
          <article
            v-for="bucket in categoryBuckets"
            :key="bucket.name"
            class="cc-dashboard__insight"
          >
            <BarChart3 :size="18" />
            <span>{{ bucket.name }}</span>
            <strong>{{ formatCurrency(bucket.value) }}</strong>
          </article>
        </section>
      </NTabPane>

      <NTabPane name="installments" tab="Parcelamentos">
        <section class="cc-dashboard__analytics-grid">
          <article class="cc-dashboard__insight">
            <CreditCard :size="18" />
            <span>Parcelas na fatura</span>
            <strong>{{ billTransactions.filter((tx) => tx.title.includes('/')).length }}</strong>
          </article>
          <article class="cc-dashboard__insight">
            <CalendarDays :size="18" />
            <span>Próximo vencimento</span>
            <strong>{{ props.bill?.cycle.dueDate ?? "—" }}</strong>
          </article>
        </section>
      </NTabPane>

      <NTabPane name="benefits" tab="Benefícios">
        <div class="cc-dashboard__benefits">
          <NTag
            v-for="benefit in props.card.benefits ?? []"
            :key="benefit"
            type="success"
            :bordered="false"
          >
            {{ benefit }}
          </NTag>
          <NEmpty
            v-if="(props.card.benefits ?? []).length === 0"
            description="Nenhum benefício mapeado"
          />
        </div>
      </NTabPane>

      <NTabPane name="analytics" tab="Analítico">
        <section class="cc-dashboard__analytics-grid">
          <article class="cc-dashboard__insight">
            <Gauge :size="18" />
            <span>Limite livre real</span>
            <strong>{{ formatCurrency(availableAmount) }}</strong>
            <small>Considera compras pendentes, pagas e limite cadastrado.</small>
          </article>
          <article class="cc-dashboard__insight">
            <CalendarDays :size="18" />
            <span>Compras após fechamento</span>
            <strong>{{ formatCurrency(pendingAmount) }}</strong>
            <small>Ajuda a prever o que já nasceu para o próximo ciclo.</small>
          </article>
          <article class="cc-dashboard__insight cc-dashboard__insight--warning">
            <AlertTriangle :size="18" />
            <span>Risco de orçamento</span>
            <strong>{{ budgetRiskLabel }}</strong>
            <small>Use “Só cartões” quando a compra não deve afetar orçamento.</small>
          </article>
        </section>
      </NTabPane>
    </NTabs>
  </section>
</template>

<style scoped>
.cc-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cc-dashboard__hero {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: stretch;
}

.cc-dashboard__card-face {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  color: white;
  background:
    linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(16, 185, 129, 0.9)),
    var(--color-brand-500);
  box-shadow: var(--shadow-lg);
}

.cc-dashboard__card-face strong {
  max-width: 11ch;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 0.95;
}

.cc-dashboard__hero-copy {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.cc-dashboard__hero-copy h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.cc-dashboard__hero-copy p {
  margin: 0;
  color: var(--color-text-secondary);
}

.cc-dashboard__eyebrow {
  margin-bottom: var(--space-1) !important;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.cc-dashboard__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.cc-dashboard__kpis :deep(.n-statistic) {
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}

.cc-dashboard__loading {
  display: flex;
  justify-content: center;
  padding: var(--space-5);
}

.cc-dashboard__charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.cc-dashboard__panel,
.cc-dashboard__insight {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
}

.cc-dashboard__panel {
  padding: var(--space-3);
}

.cc-dashboard__panel header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  font-weight: var(--font-weight-semibold);
}

.cc-dashboard__toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.cc-dashboard__transactions {
  list-style: none;
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
}

.cc-dashboard__transactions li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-outline-soft);
}

.cc-dashboard__analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.cc-dashboard__insight {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-height: 160px;
  padding: var(--space-3);
}

.cc-dashboard__insight svg {
  color: var(--color-brand-500);
}

.cc-dashboard__insight span,
.cc-dashboard__insight small {
  color: var(--color-text-secondary);
}

.cc-dashboard__insight strong {
  font-size: var(--font-size-md);
}

.cc-dashboard__insight--warning svg {
  color: var(--color-warning);
}

.cc-dashboard__benefits {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

@media (max-width: 1024px) {
  .cc-dashboard__hero,
  .cc-dashboard__charts,
  .cc-dashboard__analytics-grid {
    grid-template-columns: 1fr;
  }

  .cc-dashboard__kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .cc-dashboard__kpis {
    grid-template-columns: 1fr;
  }

  .cc-dashboard__hero-copy {
    flex-direction: column;
  }
}
</style>
