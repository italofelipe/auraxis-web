<script setup lang="ts">
import {
  Activity,
  ExternalLink,
  Flag,
  Gauge,
  RefreshCw,
  Search,
  ServerCog,
  ShieldAlert,
} from "lucide-vue-next";
import { NButton, NInput, NModal, NSelect, NSpin } from "naive-ui";

import {
  ADMIN_FEATURE_FLAG_STATUS_OPTIONS,
  type AdminFeatureFlag,
  type AdminFeatureFlagStatus,
} from "~/features/admin/operations/model/admin-operations";
import { useAdminFeatureFlagMutation } from "~/features/admin/operations/queries/use-admin-feature-flag-mutation";
import { useAdminFeatureFlagsQuery } from "~/features/admin/operations/queries/use-admin-feature-flags-query";
import { useAdminOperationsSummaryQuery } from "~/features/admin/operations/queries/use-admin-operations-summary-query";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";
import { useToast } from "~/composables/useToast/useToast";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Feature flags e operações",
  pageSubtitle: "Controle operacional de flags existentes, saúde do sistema e ponte segura para observabilidade.",
});

useHead({ title: "Admin Feature Flags | Auraxis" });

interface PendingFlagUpdate {
  readonly flag: AdminFeatureFlag;
  readonly status: AdminFeatureFlagStatus;
}

const toast = useToast();
const canMutateFlags = useFeatureFlag("web.admin.feature-flag-mutations");

const search = ref("");
const pendingUpdate = ref<PendingFlagUpdate | null>(null);
const updateReason = ref("");
const updateError = ref("");
const lastAuditId = ref<string | null>(null);

const flagsQuery = useAdminFeatureFlagsQuery();
const operationsQuery = useAdminOperationsSummaryQuery();
const updateMutation = useAdminFeatureFlagMutation();

const flags = computed(() => flagsQuery.data.value?.flags ?? []);
const operations = computed(() => operationsQuery.data.value ?? null);
const filteredFlags = computed(() => {
  const term = search.value.trim().toLowerCase();

  if (!term) {
    return flags.value;
  }

  return flags.value.filter((flag) =>
    [flag.key, flag.owner, flag.type, flag.status, flag.description]
      .some((value) => value.toLowerCase().includes(term)),
  );
});

/**
 * Opens the audited feature flag update modal.
 *
 * @param flag Feature flag being changed.
 * @param status Next rollout status.
 * @returns Nothing.
 */
const openUpdateModal = (flag: AdminFeatureFlag, status: AdminFeatureFlagStatus): void => {
  pendingUpdate.value = { flag, status };
  updateReason.value = "";
  updateError.value = "";
};

/**
 * Closes the audited feature flag update modal when idle.
 *
 * @returns Nothing.
 */
const closeUpdateModal = (): void => {
  if (updateMutation.isPending.value) {
    return;
  }

  pendingUpdate.value = null;
  updateReason.value = "";
  updateError.value = "";
};

/**
 * Validates the audit reason before submitting a flag update.
 *
 * @returns True when the audit reason is usable.
 */
const validateReason = (): boolean => {
  if (updateReason.value.trim().length < 10) {
    updateError.value = "Informe um motivo operacional com pelo menos 10 caracteres.";
    return false;
  }

  updateError.value = "";
  return true;
};

/**
 * Confirms the pending feature flag update.
 *
 * @returns Nothing.
 */
const confirmUpdate = async (): Promise<void> => {
  if (!pendingUpdate.value || !validateReason()) {
    return;
  }

  const result = await updateMutation.mutateAsync({
    key: pendingUpdate.value.flag.key,
    status: pendingUpdate.value.status,
    reason: updateReason.value.trim(),
  });

  lastAuditId.value = result.auditId;
  toast.success("Feature flag atualizada com auditoria.");
  closeUpdateModal();
};

/**
 * Refreshes operations and feature flag data.
 *
 * @returns Nothing.
 */
const refreshOperations = (): void => {
  void flagsQuery.refetch();
  void operationsQuery.refetch();
};

/**
 * Formats admin cost values in USD.
 *
 * @param value Numeric cost value.
 * @returns Localized currency string.
 */
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
  }).format(value);

/**
 * Formats timestamps shown in operations panels.
 *
 * @param value ISO timestamp or null.
 * @returns Localized timestamp label.
 */
const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "Sem sincronização";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};
</script>

<template>
  <section class="admin-flags" aria-labelledby="admin-flags-title">
    <div class="admin-flags__hero">
      <div>
        <p class="admin-flags__eyebrow">Operação segura</p>
        <h2 id="admin-flags-title">Flags, orçamento de IA e saúde operacional</h2>
        <p>
          Mutação de flags exige motivo auditável. Grafana abre em nova aba; a aplicação não
          embute painéis internos para reduzir exposição de credenciais e dados sensíveis.
        </p>
      </div>
      <NButton secondary round :loading="flagsQuery.isFetching.value || operationsQuery.isFetching.value" @click="refreshOperations">
        <template #icon>
          <RefreshCw :size="16" />
        </template>
        Atualizar
      </NButton>
    </div>

    <div class="admin-flags__summary" aria-label="Resumo operacional">
      <article>
        <Activity :size="20" aria-hidden="true" />
        <span>API</span>
        <strong>{{ operations?.apiStatus ?? "carregando" }}</strong>
      </article>
      <article>
        <ShieldAlert :size="20" aria-hidden="true" />
        <span>Circuit breaker IA</span>
        <strong>{{ operations?.aiCircuitBreaker ?? "carregando" }}</strong>
      </article>
      <article>
        <Gauge :size="20" aria-hidden="true" />
        <span>Uso de IA</span>
        <strong>
          {{ formatCurrency(operations?.monthlyAiCostUsd ?? 0) }}
          / {{ formatCurrency(operations?.monthlyAiBudgetUsd ?? 0) }}
        </strong>
      </article>
      <article>
        <ServerCog :size="20" aria-hidden="true" />
        <span>Incidentes abertos</span>
        <strong>{{ operations?.pendingIncidents ?? 0 }}</strong>
      </article>
    </div>

    <section class="admin-flags__ops-card" aria-label="Filas e observabilidade">
      <div>
        <h3>Resumo operacional via API</h3>
        <p>Última sincronização: {{ formatDateTime(operations?.lastSyncAt ?? null) }}</p>
      </div>
      <ul>
        <li v-for="queue in operations?.queues ?? []" :key="queue.name">
          <strong>{{ queue.name }}</strong>
          <span>{{ queue.pending }} pendentes · mais antigo há {{ queue.oldestAgeSeconds }}s</span>
        </li>
      </ul>
      <a
        v-if="operations?.grafanaUrl"
        class="admin-flags__grafana"
        :href="operations.grafanaUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink :size="16" aria-hidden="true" />
        Abrir Grafana Cloud
      </a>
    </section>

    <section class="admin-flags__list" aria-labelledby="admin-flags-list-title">
      <header>
        <div>
          <h3 id="admin-flags-list-title">Feature flags existentes</h3>
          <p>{{ filteredFlags.length }} flags visíveis</p>
        </div>
        <NInput v-model:value="search" clearable placeholder="Buscar por chave, owner ou status">
          <template #prefix>
            <Search :size="16" />
          </template>
        </NInput>
      </header>

      <NSpin :show="flagsQuery.isLoading.value">
        <div class="admin-flags__table">
          <article v-for="flag in filteredFlags" :key="flag.key" class="admin-flags__row">
            <div>
              <Flag :size="16" aria-hidden="true" />
              <span>
                <strong>{{ flag.key }}</strong>
                <small>{{ flag.description }}</small>
              </span>
            </div>
            <span>{{ flag.owner }}</span>
            <span>{{ flag.type }}</span>
            <NSelect
              :value="flag.status"
              :options="[...ADMIN_FEATURE_FLAG_STATUS_OPTIONS]"
              :disabled="!canMutateFlags"
              aria-label="Status da feature flag"
              @update:value="(nextStatus) => openUpdateModal(flag, nextStatus as AdminFeatureFlagStatus)"
            />
          </article>
        </div>

        <p v-if="!flagsQuery.isLoading.value && filteredFlags.length === 0" class="admin-flags__empty">
          Nenhuma flag encontrada.
        </p>
      </NSpin>

      <p v-if="lastAuditId" class="admin-flags__audit" aria-live="polite">
        Último audit id: <strong>{{ lastAuditId }}</strong>
      </p>
    </section>

    <NModal
      :show="pendingUpdate !== null"
      preset="card"
      title="Confirmar alteração de flag"
      class="admin-flags__modal"
      @update:show="(show) => { if (!show) closeUpdateModal(); }"
    >
      <p v-if="pendingUpdate">
        Alterar <strong>{{ pendingUpdate.flag.key }}</strong> para
        <strong>{{ pendingUpdate.status }}</strong>.
      </p>
      <NInput
        v-model:value="updateReason"
        type="textarea"
        placeholder="Explique o motivo operacional da mudança"
      />
      <p v-if="updateError" class="admin-flags__error">
        {{ updateError }}
      </p>
      <template #footer>
        <NButton secondary :disabled="updateMutation.isPending.value" @click="closeUpdateModal">
          Cancelar
        </NButton>
        <NButton type="primary" :loading="updateMutation.isPending.value" @click="confirmUpdate">
          Confirmar com auditoria
        </NButton>
      </template>
    </NModal>
  </section>
</template>

<style scoped>
.admin-flags {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.admin-flags__hero,
.admin-flags__summary article,
.admin-flags__ops-card,
.admin-flags__list,
.admin-flags__row {
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.admin-flags__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.admin-flags__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-brand-700);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.admin-flags h2,
.admin-flags h3 {
  margin: 0;
  font-family: var(--font-heading);
}

.admin-flags p,
.admin-flags small,
.admin-flags__summary span,
.admin-flags__ops-card span {
  color: var(--color-text-muted);
}

.admin-flags__hero p {
  max-width: 760px;
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-md);
}

.admin-flags__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-2);
}

.admin-flags__summary article {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.admin-flags__summary svg,
.admin-flags__row svg {
  color: var(--color-brand-700);
}

.admin-flags__summary strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
}

.admin-flags__ops-card,
.admin-flags__list {
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-flags__ops-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.7fr) auto;
  gap: var(--space-3);
  align-items: center;
}

.admin-flags__ops-card ul {
  display: grid;
  gap: var(--space-1);
  padding: 0;
  margin: 0;
  list-style: none;
}

.admin-flags__ops-card li {
  display: grid;
}

.admin-flags__grafana {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: 10px var(--space-2);
  border-radius: var(--radius-full);
  color: var(--color-text-on-brand);
  background: var(--gradient-brand);
  text-decoration: none;
  font-weight: var(--font-weight-bold);
}

.admin-flags__list header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 380px);
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-2);
}

.admin-flags__table {
  display: grid;
  gap: var(--space-1);
}

.admin-flags__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px 110px minmax(180px, 220px);
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
}

.admin-flags__row > div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.admin-flags__row span,
.admin-flags__row small {
  min-width: 0;
  display: block;
}

.admin-flags__empty,
.admin-flags__audit,
.admin-flags__error {
  margin: var(--space-2) 0 0;
}

.admin-flags__error {
  color: var(--color-danger-dark);
}

:global(.admin-flags__modal) {
  max-width: 560px;
}

@media (max-width: 1080px) {
  .admin-flags__hero,
  .admin-flags__ops-card {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-3);
  }

  .admin-flags__summary,
  .admin-flags__list header,
  .admin-flags__row {
    grid-template-columns: 1fr;
  }
}
</style>
