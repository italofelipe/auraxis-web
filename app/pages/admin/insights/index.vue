<script setup lang="ts">
import {
  AlertTriangle,
  BadgeDollarSign,
  Database,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-vue-next";
import { NButton, NInput, NPagination, NSelect, NSpin } from "naive-ui";

import {
  ADMIN_AI_INSIGHT_STATUS_OPTIONS,
  type AdminAIInsightSummary,
} from "~/features/admin/insights/model/admin-insight";
import { useAdminInsightQuery } from "~/features/admin/insights/queries/use-admin-insight-query";
import { useAdminInsightsQuery } from "~/features/admin/insights/queries/use-admin-insights-query";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Insights IA e auditoria",
  pageSubtitle: "Histórico, custos, consentimento e evidências redigidas dos insights.",
});

useHead({ title: "Admin Insights IA | Auraxis" });

const searchDraft = ref("");
const submittedSearch = ref("");
const status = ref("all");
const page = ref(1);
const perPage = ref(20);
const selectedInsightId = ref<string | null>(null);

const insightsQuery = useAdminInsightsQuery(() => ({
  search: submittedSearch.value,
  status: status.value as never,
  page: page.value,
  perPage: perPage.value,
}));
const selectedInsightQuery = useAdminInsightQuery(selectedInsightId);

const insights = computed(() => insightsQuery.data.value?.items ?? []);
const kpis = computed(() => insightsQuery.data.value?.kpis ?? {
  totalCostUsd: 0,
  totalTokens: 0,
  failedCount: 0,
  missingConsentCount: 0,
});
const selectedInsight = computed(() => selectedInsightQuery.data.value ?? null);
const totalInsights = computed(() => insightsQuery.data.value?.total ?? insights.value.length);

watch(
  insights,
  (currentInsights) => {
    if (currentInsights.length === 0) {
      selectedInsightId.value = null;
      return;
    }

    if (!selectedInsightId.value || !currentInsights.some((item) => item.id === selectedInsightId.value)) {
      selectedInsightId.value = currentInsights[0]?.id ?? null;
    }
  },
  { immediate: true },
);

/**
 * Applies the insight search text to the active query.
 *
 * @returns Nothing.
 */
const submitSearch = (): void => {
  submittedSearch.value = searchDraft.value.trim();
  page.value = 1;
};

/**
 * Clears insight filters and returns to the first page.
 *
 * @returns Nothing.
 */
const clearFilters = (): void => {
  searchDraft.value = "";
  submittedSearch.value = "";
  status.value = "all";
  page.value = 1;
};

/**
 * Selects one insight for the detail panel.
 *
 * @param insight Insight summary selected by the admin.
 * @returns Nothing.
 */
const selectInsight = (insight: AdminAIInsightSummary): void => {
  selectedInsightId.value = insight.id;
};

/**
 * Refreshes list and detail query data.
 *
 * @returns Nothing.
 */
const refreshInsights = (): void => {
  void insightsQuery.refetch();

  if (selectedInsightId.value) {
    void selectedInsightQuery.refetch();
  }
};

/**
 * Formats insight cost values in USD.
 *
 * @param value Numeric cost value.
 * @returns Localized currency string.
 */
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);

/**
 * Formats timestamps shown in insight audit panels.
 *
 * @param value ISO timestamp or null.
 * @returns Localized timestamp label.
 */
const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};
</script>

<template>
  <section class="admin-insights" aria-labelledby="admin-insights-title">
    <div class="admin-insights__hero">
      <div>
        <p class="admin-insights__eyebrow">Auditoria operacional</p>
        <h2 id="admin-insights-title">Investigue custo, qualidade e consentimento dos insights</h2>
        <p>
          Esta visão mostra somente evidências redigidas e metadados operacionais.
          Prompts completos e PII desnecessária não aparecem na interface admin.
        </p>
      </div>
      <NButton secondary round :loading="insightsQuery.isFetching.value" @click="refreshInsights">
        <template #icon>
          <RefreshCw :size="16" />
        </template>
        Atualizar
      </NButton>
    </div>

    <div class="admin-insights__kpis" aria-label="Indicadores de IA">
      <article>
        <BadgeDollarSign :size="20" aria-hidden="true" />
        <span>Custo mensal</span>
        <strong>{{ formatCurrency(kpis.totalCostUsd) }}</strong>
      </article>
      <article>
        <Database :size="20" aria-hidden="true" />
        <span>Tokens usados</span>
        <strong>{{ kpis.totalTokens.toLocaleString("pt-BR") }}</strong>
      </article>
      <article>
        <AlertTriangle :size="20" aria-hidden="true" />
        <span>Falhas</span>
        <strong>{{ kpis.failedCount }}</strong>
      </article>
      <article>
        <ShieldCheck :size="20" aria-hidden="true" />
        <span>Sem consentimento</span>
        <strong>{{ kpis.missingConsentCount }}</strong>
      </article>
    </div>

    <div class="admin-insights__filters">
      <NInput
        v-model:value="searchDraft"
        clearable
        placeholder="Buscar por usuário, modelo ou período"
        @keyup.enter="submitSearch"
      >
        <template #prefix>
          <Search :size="16" />
        </template>
      </NInput>
      <NSelect
        v-model:value="status"
        :options="[...ADMIN_AI_INSIGHT_STATUS_OPTIONS]"
        aria-label="Status do insight"
        @update:value="page = 1"
      />
      <NButton type="primary" @click="submitSearch">
        Buscar
      </NButton>
      <NButton secondary @click="clearFilters">
        Limpar
      </NButton>
    </div>

    <div class="admin-insights__content">
      <section class="admin-insights__list" aria-label="Histórico de insights">
        <header>
          <div>
            <h3>Histórico auditável</h3>
            <p>{{ totalInsights }} registros encontrados</p>
          </div>
        </header>

        <NSpin :show="insightsQuery.isLoading.value">
          <button
            v-for="insight in insights"
            :key="insight.id"
            type="button"
            class="admin-insights__row"
            :class="{ 'admin-insights__row--active': insight.id === selectedInsightId }"
            @click="selectInsight(insight)"
          >
            <span>
              <strong>{{ insight.userEmail }}</strong>
              <small>{{ insight.periodLabel }} · {{ insight.model }}</small>
            </span>
            <span>
              <strong>{{ formatCurrency(insight.costUsd) }}</strong>
              <small>{{ insight.tokensUsed.toLocaleString("pt-BR") }} tokens</small>
            </span>
            <span class="admin-insights__status" :data-status="insight.status">
              {{ insight.status }}
            </span>
          </button>

          <p v-if="!insightsQuery.isLoading.value && insights.length === 0" class="admin-insights__empty">
            Nenhum insight encontrado para os filtros selecionados.
          </p>
        </NSpin>

        <NPagination
          v-if="totalInsights > perPage"
          v-model:page="page"
          :page-size="perPage"
          :item-count="totalInsights"
        />
      </section>

      <aside class="admin-insights__detail" aria-label="Detalhe do insight">
        <NSpin :show="selectedInsightQuery.isLoading.value">
          <template v-if="selectedInsight">
            <div class="admin-insights__detail-heading">
              <Sparkles :size="22" aria-hidden="true" />
              <div>
                <h3>{{ selectedInsight.periodLabel }}</h3>
                <p>{{ selectedInsight.userEmail }} · {{ formatDateTime(selectedInsight.createdAt) }}</p>
              </div>
            </div>

            <div class="admin-insights__detail-grid">
              <article>
                <span>Status</span>
                <strong>{{ selectedInsight.status }}</strong>
              </article>
              <article>
                <span>Consentimento</span>
                <strong>{{ selectedInsight.consentStatus }}</strong>
              </article>
              <article>
                <span>Latência</span>
                <strong>{{ selectedInsight.latencyMs ?? 0 }} ms</strong>
              </article>
              <article>
                <span>Template</span>
                <strong>{{ selectedInsight.promptTemplateVersion }}</strong>
              </article>
            </div>

            <section class="admin-insights__panel">
              <h4>Resumo operacional</h4>
              <p>{{ selectedInsight.summary }}</p>
            </section>

            <section class="admin-insights__panel">
              <h4>Evidências redigidas</h4>
              <ul>
                <li v-for="evidence in selectedInsight.redactedEvidence" :key="evidence">
                  <FileText :size="15" aria-hidden="true" />
                  {{ evidence }}
                </li>
              </ul>
              <p v-if="selectedInsight.redactedEvidence.length === 0">
                Nenhuma evidência redigida foi retornada pela API.
              </p>
            </section>

            <section class="admin-insights__panel">
              <h4>Auditoria relacionada</h4>
              <ul>
                <li v-for="event in selectedInsight.auditEvents" :key="event.id">
                  <ShieldCheck :size="15" aria-hidden="true" />
                  {{ event.action }} · {{ event.actorEmail ?? "sistema" }} · {{ formatDateTime(event.createdAt) }}
                </li>
              </ul>
            </section>
          </template>

          <p v-else class="admin-insights__empty">
            Selecione um insight para ver evidências, custo e consentimento.
          </p>
        </NSpin>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.admin-insights,
.admin-insights__list,
.admin-insights__detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.admin-insights__hero,
.admin-insights__kpis article,
.admin-insights__filters,
.admin-insights__list,
.admin-insights__detail,
.admin-insights__panel {
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.admin-insights__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.admin-insights__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-brand-700);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.admin-insights__hero h2,
.admin-insights__list h3,
.admin-insights__detail h3,
.admin-insights__panel h4 {
  margin: 0;
  font-family: var(--font-heading);
}

.admin-insights__hero p,
.admin-insights__list p,
.admin-insights__detail p,
.admin-insights__row small {
  color: var(--color-text-muted);
}

.admin-insights__hero p {
  max-width: 760px;
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-md);
}

.admin-insights__kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.admin-insights__kpis article {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.admin-insights__kpis svg {
  color: var(--color-brand-700);
}

.admin-insights__kpis span,
.admin-insights__detail-grid span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.admin-insights__kpis strong,
.admin-insights__detail-grid strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.admin-insights__filters {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(180px, 240px) auto auto;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-insights__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.75fr);
  gap: var(--space-3);
  align-items: start;
}

.admin-insights__list,
.admin-insights__detail {
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-insights__list header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin-insights__row {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(130px, auto) auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  text-align: left;
  cursor: pointer;
}

.admin-insights__row + .admin-insights__row {
  margin-top: var(--space-1);
}

.admin-insights__row--active {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}

.admin-insights__row span,
.admin-insights__row small {
  min-width: 0;
  display: block;
}

.admin-insights__status {
  padding: 4px 8px;
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  background: var(--color-bg-surface);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.admin-insights__status[data-status="failed"],
.admin-insights__status[data-status="rejected"] {
  color: var(--color-danger-dark);
  background: var(--color-danger-glow);
}

.admin-insights__detail-heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.admin-insights__detail-heading svg {
  color: var(--color-brand-700);
}

.admin-insights__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.admin-insights__detail-grid article,
.admin-insights__panel {
  padding: var(--space-2);
  border-radius: var(--radius-md);
}

.admin-insights__detail-grid article {
  display: grid;
  gap: 2px;
  background: var(--color-bg-elevated);
}

.admin-insights__detail-grid strong {
  overflow-wrap: anywhere;
  line-height: 1.2;
}

.admin-insights__panel ul {
  display: grid;
  gap: var(--space-1);
  padding: 0;
  margin: var(--space-2) 0 0;
  list-style: none;
}

.admin-insights__panel li {
  display: flex;
  gap: var(--space-1);
  color: var(--color-text-muted);
}

.admin-insights__empty {
  margin: 0;
  padding: var(--space-3);
  color: var(--color-text-muted);
}

@media (max-width: 1080px) {
  .admin-insights__content,
  .admin-insights__kpis,
  .admin-insights__filters {
    grid-template-columns: 1fr;
  }

  .admin-insights__hero {
    flex-direction: column;
    padding: var(--space-3);
  }
}
</style>
