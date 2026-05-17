<script setup lang="ts">
import {
  Bell,
  ChevronDown,
  Download,
  Ellipsis,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  TableColumnsSplit,
  Wallet,
} from "lucide-vue-next";

definePageMeta({ layout: false });

useSeoMeta({
  title: "Resultado Trimestral Detalhado | Auraxis",
  description:
    "Visualize KPIs, tendências, insights automáticos e ledger financeiro em um relatório trimestral detalhado.",
  ogTitle: "Resultado Trimestral Detalhado | Auraxis",
  ogDescription:
    "Relatório financeiro trimestral em layout Market Pulse com indicadores, gráfico e insights automáticos.",
  twitterCard: "summary_large_image",
});

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Transações", icon: Wallet, active: false },
  { label: "Analytics", icon: TableColumnsSplit, active: false },
  { label: "Relatórios", icon: FileText, active: false },
] as const;

const kpis = [
  {
    label: "Receita total",
    value: "R$ 4.2M",
    delta: "+12.5%",
    note: "vs. trimestre anterior",
    tone: "cyan",
  },
  {
    label: "Lucro líquido",
    value: "R$ 850K",
    delta: "+8.2%",
    note: "margem consolidada",
    tone: "violet",
  },
  {
    label: "Margem EBITDA",
    value: "24.5%",
    delta: "-1.2%",
    note: "pressão operacional",
    tone: "red",
  },
  {
    label: "Crescimento YoY",
    value: "32.8%",
    delta: "+5.4%",
    note: "acima da meta",
    tone: "lime",
  },
] as const;

const chartSeries = [
  { label: "Jul 1", income: 34, expense: 22 },
  { label: "Jul 15", income: 44, expense: 28 },
  { label: "Ago 1", income: 55, expense: 34 },
  { label: "Ago 15", income: 68, expense: 43 },
  { label: "Set 1", income: 80, expense: 50 },
  { label: "Set 15", income: 88, expense: 56 },
  { label: "Set 30", income: 100, expense: 66 },
] as const;

const insights = [
  {
    title: "Assinaturas de software em alta",
    description:
      "Custos de infraestrutura subiram 14% em agosto. Vale revisar instâncias ociosas antes do próximo ciclo.",
    tone: "cyan",
  },
  {
    title: "Meta trimestral antecipada",
    description:
      "Receitas recorrentes superaram o plano em R$ 400k, puxadas por contratos enterprise.",
    tone: "lime",
  },
  {
    title: "CAC de marketing aumentou",
    description:
      "Aquisição paga cresceu 8% no trimestre. Rebalanceie canais com menor retorno marginal.",
    tone: "red",
  },
] as const;

const rows = [
  {
    id: "#TRX-8924",
    date: "28 Set 2025",
    description: "AWS Enterprise Hosting",
    department: "Engenharia",
    amount: "-R$ 124.500,00",
    status: "Concluído",
    tone: "neutral",
  },
  {
    id: "#TRX-8923",
    date: "27 Set 2025",
    description: "Renovação Q3 Enterprise",
    department: "Vendas",
    amount: "+R$ 745.000,00",
    status: "Concluído",
    tone: "cyan",
  },
  {
    id: "#TRX-8922",
    date: "25 Set 2025",
    description: "Campanha Google Ads",
    department: "Marketing",
    amount: "-R$ 62.450,00",
    status: "Pendente",
    tone: "neutral",
  },
  {
    id: "#TRX-8921",
    date: "22 Set 2025",
    description: "Consultoria jurídica",
    department: "Operações",
    amount: "-R$ 25.200,00",
    status: "Concluído",
    tone: "neutral",
  },
] as const;
</script>

<template>
  <div class="detailed-quarter-page">
      <aside class="detailed-quarter-page__rail" aria-label="Navegação de relatório">
        <div class="detailed-quarter-page__brand">
          <span>A</span>
          <strong>Auraxis</strong>
        </div>
        <nav class="detailed-quarter-page__nav">
          <a
            v-for="item in navItems"
            :key="item.label"
            href="#"
            :class="{ 'detailed-quarter-page__nav-link--active': item.active }"
            class="detailed-quarter-page__nav-link"
          >
            <component :is="item.icon" :size="19" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </a>
        </nav>
        <a href="#" class="detailed-quarter-page__nav-link">
          <Settings :size="19" aria-hidden="true" />
          <span>Configurações</span>
        </a>
      </aside>

      <main class="detailed-quarter-page__main">
        <header class="detailed-quarter-page__topbar">
          <div>
            <h1>Resultado Trimestral Detalhado</h1>
            <p>Q3 2025 · Visão financeira consolidada</p>
          </div>
          <div class="detailed-quarter-page__topbar-actions">
            <label class="detailed-quarter-page__search">
              <Search :size="16" aria-hidden="true" />
              <input type="search" placeholder="Buscar métricas...">
            </label>
            <button type="button" class="detailed-quarter-page__icon-button" aria-label="Notificações">
              <Bell :size="18" aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
            <div class="detailed-quarter-page__avatar" aria-label="Perfil">I</div>
          </div>
        </header>

        <div class="detailed-quarter-page__content">
          <section class="detailed-quarter-page__kpis" aria-label="Indicadores do trimestre">
            <article
              v-for="kpi in kpis"
              :key="kpi.label"
              class="detailed-quarter-page__card detailed-quarter-page__kpi"
              :class="`detailed-quarter-page__kpi--${kpi.tone}`"
            >
              <div>
                <span>{{ kpi.label }}</span>
                <strong>{{ kpi.value }}</strong>
              </div>
              <p>
                <em>{{ kpi.delta }}</em>
                {{ kpi.note }}
              </p>
            </article>
          </section>

          <section class="detailed-quarter-page__analysis">
            <article class="detailed-quarter-page__card detailed-quarter-page__chart-panel">
              <div class="detailed-quarter-page__panel-heading">
                <div>
                  <h2>Tendência de Receita vs Despesas</h2>
                  <p>Visão acumulada ao longo do trimestre</p>
                </div>
                <div class="detailed-quarter-page__segmented" aria-label="Tipo de gráfico">
                  <button type="button" aria-pressed="true">Área</button>
                  <button type="button" aria-pressed="false">Barra</button>
                </div>
              </div>
              <div class="detailed-quarter-page__chart-wrap">
                <svg viewBox="0 0 720 320" preserveAspectRatio="none" role="img" aria-label="Gráfico de receitas e despesas">
                  <path
                    class="detailed-quarter-page__area detailed-quarter-page__area--income"
                    d="M0 260 C70 226 98 232 130 202 C182 154 214 174 268 132 C340 78 384 102 444 72 C535 26 594 76 720 34 L720 320 L0 320 Z"
                  />
                  <path
                    class="detailed-quarter-page__line detailed-quarter-page__line--income"
                    d="M0 260 C70 226 98 232 130 202 C182 154 214 174 268 132 C340 78 384 102 444 72 C535 26 594 76 720 34"
                  />
                  <path
                    class="detailed-quarter-page__area detailed-quarter-page__area--expense"
                    d="M0 286 C72 252 108 262 148 230 C206 190 248 206 306 166 C380 124 438 138 504 104 C594 70 636 114 720 82 L720 320 L0 320 Z"
                  />
                  <path
                    class="detailed-quarter-page__line detailed-quarter-page__line--expense"
                    d="M0 286 C72 252 108 262 148 230 C206 190 248 206 306 166 C380 124 438 138 504 104 C594 70 636 114 720 82"
                  />
                </svg>
                <div class="detailed-quarter-page__chart-labels" aria-hidden="true">
                  <span v-for="point in chartSeries" :key="point.label">{{ point.label }}</span>
                </div>
              </div>
            </article>

            <article class="detailed-quarter-page__card detailed-quarter-page__insights">
              <div class="detailed-quarter-page__panel-heading detailed-quarter-page__panel-heading--compact">
                <h2>
                  <Sparkles :size="18" aria-hidden="true" />
                  Insights Automáticos
                </h2>
                <button type="button" aria-label="Mais opções">
                  <Ellipsis :size="18" aria-hidden="true" />
                </button>
              </div>
              <div class="detailed-quarter-page__insight-list">
                <article
                  v-for="insight in insights"
                  :key="insight.title"
                  class="detailed-quarter-page__insight"
                  :class="`detailed-quarter-page__insight--${insight.tone}`"
                >
                  <span aria-hidden="true" />
                  <div>
                    <h3>{{ insight.title }}</h3>
                    <p>{{ insight.description }}</p>
                  </div>
                </article>
              </div>
              <button type="button" class="detailed-quarter-page__report-button">
                Gerar Relatório Completo
              </button>
            </article>
          </section>

          <section class="detailed-quarter-page__card detailed-quarter-page__ledger">
            <div class="detailed-quarter-page__ledger-head">
              <div>
                <h2>Ledger Detalhado</h2>
                <p>Registros financeiros recentes e categorizações</p>
              </div>
              <div class="detailed-quarter-page__filters">
                <button type="button">Categoria <ChevronDown :size="13" aria-hidden="true" /></button>
                <button type="button">Departamento <ChevronDown :size="13" aria-hidden="true" /></button>
                <button type="button">Status <ChevronDown :size="13" aria-hidden="true" /></button>
                <button type="button" class="detailed-quarter-page__export">
                  <Download :size="14" aria-hidden="true" />
                  Exportar
                </button>
              </div>
            </div>
            <div class="detailed-quarter-page__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Departamento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rows" :key="row.id">
                    <td>{{ row.id }}</td>
                    <td>{{ row.date }}</td>
                    <td>{{ row.description }}</td>
                    <td>{{ row.department }}</td>
                    <td :class="`detailed-quarter-page__amount--${row.tone}`">{{ row.amount }}</td>
                    <td><span>{{ row.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
  </div>
</template>

<style scoped>
.detailed-quarter-page {
  min-height: 100dvh;
  display: flex;
  background:
    linear-gradient(180deg, rgba(6, 182, 212, 0.045), transparent 28rem),
    var(--color-bg-base);
  color: var(--color-text-primary);
}

.detailed-quarter-page__rail {
  width: clamp(5rem, 16vw, 15rem);
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(5, 7, 13, 0.94);
}

.detailed-quarter-page__brand {
  min-height: 5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-inline: clamp(1rem, 2vw, 1.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.detailed-quarter-page__brand span,
.detailed-quarter-page__avatar {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  color: #fff;
  font-weight: var(--font-weight-extrabold);
}

.detailed-quarter-page__brand strong {
  font-size: var(--font-size-xl);
}

.detailed-quarter-page__nav {
  flex: 1;
  display: grid;
  align-content: start;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
}

.detailed-quarter-page__rail > .detailed-quarter-page__nav-link {
  margin: 0.75rem;
}

.detailed-quarter-page__nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 3rem;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.detailed-quarter-page__nav-link--active {
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.2);
  background: rgba(6, 182, 212, 0.1);
}

.detailed-quarter-page__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detailed-quarter-page__topbar {
  min-height: 5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem clamp(1.25rem, 3vw, 2.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.detailed-quarter-page__topbar h1,
.detailed-quarter-page__ledger h2,
.detailed-quarter-page__panel-heading h2 {
  margin: 0;
  font-size: clamp(1.25rem, 2.3vw, 1.75rem);
}

.detailed-quarter-page__topbar p,
.detailed-quarter-page__ledger p,
.detailed-quarter-page__panel-heading p {
  margin: 0.3rem 0 0;
  color: var(--color-text-muted);
}

.detailed-quarter-page__topbar-actions,
.detailed-quarter-page__filters,
.detailed-quarter-page__segmented,
.detailed-quarter-page__chart-labels {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detailed-quarter-page__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: min(18rem, 26vw);
  min-height: 2.5rem;
  padding-inline: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text-muted);
}

.detailed-quarter-page__search input {
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-text-primary);
}

.detailed-quarter-page__icon-button {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text-muted);
}

.detailed-quarter-page__icon-button span {
  position: absolute;
  top: 0.62rem;
  right: 0.62rem;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: var(--radius-full);
  background: #06b6d4;
}

.detailed-quarter-page__content {
  display: grid;
  gap: 1.5rem;
  padding: clamp(1.25rem, 3vw, 2.5rem);
}

.detailed-quarter-page__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.detailed-quarter-page__card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.035);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
}

.detailed-quarter-page__kpi {
  min-height: 10rem;
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.detailed-quarter-page__kpi span {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.detailed-quarter-page__kpi strong {
  display: block;
  margin-top: 0.8rem;
  font-family: var(--font-mono);
  font-size: clamp(1.8rem, 3vw, 2.25rem);
}

.detailed-quarter-page__kpi p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.detailed-quarter-page__kpi em {
  display: inline-flex;
  margin-right: 0.4rem;
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-xs);
  font-style: normal;
  font-family: var(--font-mono);
}

.detailed-quarter-page__kpi--cyan em,
.detailed-quarter-page__kpi--cyan strong,
.detailed-quarter-page__amount--cyan {
  color: #06b6d4;
}

.detailed-quarter-page__kpi--violet em,
.detailed-quarter-page__kpi--violet strong {
  color: #8b5cf6;
}

.detailed-quarter-page__kpi--lime em,
.detailed-quarter-page__kpi--lime strong {
  color: #84cc16;
}

.detailed-quarter-page__kpi--red em,
.detailed-quarter-page__kpi--red strong {
  color: #ef4444;
}

.detailed-quarter-page__analysis {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(320px, 0.8fr);
  gap: 1rem;
}

.detailed-quarter-page__chart-panel,
.detailed-quarter-page__insights,
.detailed-quarter-page__ledger {
  padding: 1.35rem;
}

.detailed-quarter-page__panel-heading,
.detailed-quarter-page__ledger-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detailed-quarter-page__panel-heading--compact {
  align-items: center;
}

.detailed-quarter-page__panel-heading--compact h2 {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.detailed-quarter-page__panel-heading--compact svg {
  color: #06b6d4;
}

.detailed-quarter-page__panel-heading--compact button,
.detailed-quarter-page__segmented button,
.detailed-quarter-page__filters button,
.detailed-quarter-page__report-button {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
  background: rgba(5, 7, 13, 0.62);
  color: var(--color-text-secondary);
}

.detailed-quarter-page__panel-heading--compact button {
  width: 2rem;
  height: 2rem;
  display: grid;
  place-items: center;
}

.detailed-quarter-page__segmented {
  gap: 0.25rem;
  padding: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  background: rgba(5, 7, 13, 0.72);
}

.detailed-quarter-page__segmented button {
  min-height: 2rem;
  padding-inline: 0.85rem;
  border-radius: var(--radius-xs);
  border-color: transparent;
}

.detailed-quarter-page__segmented button[aria-pressed="true"] {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

.detailed-quarter-page__chart-wrap {
  min-height: 24rem;
  position: relative;
  padding: 1rem 1rem 2.4rem;
  border-radius: var(--radius-lg);
  background:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    rgba(5, 7, 13, 0.54);
  background-size: 100% 25%, auto;
}

.detailed-quarter-page__chart-wrap svg {
  width: 100%;
  height: 21rem;
}

.detailed-quarter-page__area--income {
  fill: rgba(6, 182, 212, 0.16);
}

.detailed-quarter-page__area--expense {
  fill: rgba(139, 92, 246, 0.14);
}

.detailed-quarter-page__line {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}

.detailed-quarter-page__line--income {
  stroke: #06b6d4;
}

.detailed-quarter-page__line--expense {
  stroke: #8b5cf6;
}

.detailed-quarter-page__chart-labels {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 0.8rem;
  justify-content: space-between;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.detailed-quarter-page__insights {
  display: flex;
  flex-direction: column;
}

.detailed-quarter-page__insight-list {
  display: grid;
  gap: 0.9rem;
  flex: 1;
}

.detailed-quarter-page__insight {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgba(6, 182, 212, 0.12);
  border-radius: var(--radius-md);
  background: rgba(6, 182, 212, 0.05);
}

.detailed-quarter-page__insight > span {
  width: 0.5rem;
  height: 0.5rem;
  margin-top: 0.45rem;
  border-radius: var(--radius-full);
  background: #06b6d4;
  flex: 0 0 auto;
}

.detailed-quarter-page__insight--lime {
  border-color: rgba(132, 204, 22, 0.12);
  background: rgba(132, 204, 22, 0.05);
}

.detailed-quarter-page__insight--lime > span {
  background: #84cc16;
}

.detailed-quarter-page__insight--red {
  border-color: rgba(239, 68, 68, 0.12);
  background: rgba(239, 68, 68, 0.05);
}

.detailed-quarter-page__insight--red > span {
  background: #ef4444;
}

.detailed-quarter-page__insight h3 {
  margin: 0 0 0.3rem;
  font-size: var(--font-size-sm);
}

.detailed-quarter-page__insight p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

.detailed-quarter-page__report-button {
  min-height: 2.75rem;
  margin-top: 1rem;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.detailed-quarter-page__ledger {
  padding-bottom: 0;
  overflow: hidden;
}

.detailed-quarter-page__filters {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.detailed-quarter-page__filters button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.3rem;
  padding-inline: 0.75rem;
  font-size: var(--font-size-xs);
}

.detailed-quarter-page__filters .detailed-quarter-page__export {
  background: #06b6d4;
  color: #fff;
}

.detailed-quarter-page__table-wrap {
  margin-inline: -1.35rem;
  overflow-x: auto;
}

.detailed-quarter-page__table-wrap table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.detailed-quarter-page__table-wrap th,
.detailed-quarter-page__table-wrap td {
  padding: 1rem 1.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: left;
  white-space: nowrap;
}

.detailed-quarter-page__table-wrap th {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.detailed-quarter-page__table-wrap td {
  color: var(--color-text-secondary);
}

.detailed-quarter-page__table-wrap td:first-child,
.detailed-quarter-page__table-wrap td:nth-child(5) {
  font-family: var(--font-mono);
}

.detailed-quarter-page__table-wrap td:nth-child(3) {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.detailed-quarter-page__table-wrap td:nth-child(5) {
  text-align: right;
}

.detailed-quarter-page__table-wrap td:last-child span {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-xs);
  background: rgba(132, 204, 22, 0.1);
  color: #84cc16;
  font-size: var(--font-size-xs);
}

@media (max-width: 1180px) {
  .detailed-quarter-page__kpis,
  .detailed-quarter-page__analysis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detailed-quarter-page__chart-panel,
  .detailed-quarter-page__ledger {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .detailed-quarter-page {
    display: block;
  }

  .detailed-quarter-page__rail {
    display: none;
  }

  .detailed-quarter-page__topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .detailed-quarter-page__topbar-actions {
    width: 100%;
  }

  .detailed-quarter-page__search {
    width: 100%;
  }

  .detailed-quarter-page__kpis,
  .detailed-quarter-page__analysis {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .detailed-quarter-page__content {
    padding-inline: 1rem;
  }

  .detailed-quarter-page__topbar-actions {
    display: grid;
    grid-template-columns: 1fr auto auto;
  }

  .detailed-quarter-page__panel-heading,
  .detailed-quarter-page__ledger-head {
    flex-direction: column;
  }

  .detailed-quarter-page__segmented,
  .detailed-quarter-page__filters {
    width: 100%;
  }
}
</style>
