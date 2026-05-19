<script setup lang="ts">
import {
  Ban,
  CheckCircle2,
  Clock3,
  Crown,
  History,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-vue-next";
import { NAlert, NButton, NInput, NModal, NPagination, NSelect, NSpin } from "naive-ui";

import { useToast } from "~/composables/useToast/useToast";
import { useAdminAccess } from "~/features/admin/model/admin-access";
import {
  ADMIN_ENTITLEMENT_OPTIONS,
  type AdminUserEntitlement,
} from "~/features/admin/users/model/admin-user";
import {
  useGrantAdminEntitlementMutation,
  useRevokeAdminEntitlementMutation,
} from "~/features/admin/users/queries/use-admin-entitlement-mutations";
import { useAdminUserQuery } from "~/features/admin/users/queries/use-admin-user-query";
import { useAdminUsersQuery } from "~/features/admin/users/queries/use-admin-users-query";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Usuários, assinaturas e entitlements",
  pageSubtitle: "Busca operacional, detalhe de assinatura e ações auditáveis.",
});

useHead({ title: "Admin Usuários | Auraxis" });

type EntitlementActionKind = "grant" | "revoke";

interface PendingEntitlementAction {
  readonly kind: EntitlementActionKind;
  readonly featureKey?: string;
  readonly entitlementId?: string;
  readonly label: string;
}

const toast = useToast();
const { isAdmin } = useAdminAccess();
const mutationsEnabled = useFeatureFlag("web.admin.entitlement-mutations");

const searchDraft = ref("");
const submittedSearch = ref("");
const page = ref(1);
const perPage = ref(20);
const selectedUserId = ref<string | null>(null);
const selectedFeatureKey = ref<string | null>(null);
const pendingAction = ref<PendingEntitlementAction | null>(null);
const actionReason = ref("");
const actionError = ref("");
const lastAuditId = ref<string | null>(null);

const usersQuery = useAdminUsersQuery(() => ({
  search: submittedSearch.value,
  page: page.value,
  perPage: perPage.value,
}));
const selectedUserQuery = useAdminUserQuery(selectedUserId);
const grantMutation = useGrantAdminEntitlementMutation();
const revokeMutation = useRevokeAdminEntitlementMutation();

const users = computed(() => usersQuery.data.value?.users ?? []);
const selectedUser = computed(() => selectedUserQuery.data.value ?? null);
const activeEntitlements = computed(() =>
  selectedUser.value?.entitlements.filter((entitlement) => entitlement.active) ?? [],
);
const isMutating = computed(() => grantMutation.isPending.value || revokeMutation.isPending.value);
const canMutate = computed(() => isAdmin.value && mutationsEnabled.value);
const userCountLabel = computed(() => {
  const total = usersQuery.data.value?.total ?? users.value.length;
  return `${total} ${total === 1 ? "usuário" : "usuários"}`;
});
const premiumCount = computed(() =>
  users.value.filter((user) => user.subscriptionPlan !== "free").length,
);
const entitlementCount = computed(() =>
  users.value.reduce((total, user) => total + user.entitlementCount, 0),
);
const grantOptions = computed(() => {
  const activeKeys = new Set(activeEntitlements.value.map((entitlement) => entitlement.featureKey));

  return ADMIN_ENTITLEMENT_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
    disabled: activeKeys.has(option.value),
  }));
});

watch(
  users,
  (currentUsers) => {
    if (currentUsers.length === 0) {
      selectedUserId.value = null;
      return;
    }

    if (!selectedUserId.value || !currentUsers.some((user) => user.id === selectedUserId.value)) {
      selectedUserId.value = currentUsers[0]?.id ?? null;
    }
  },
  { immediate: true },
);

watch(selectedUserId, () => {
  selectedFeatureKey.value = null;
  lastAuditId.value = null;
});

/**
 * Applies the typed search term to the admin users query.
 */
const submitSearch = (): void => {
  submittedSearch.value = searchDraft.value.trim();
  page.value = 1;
};

/**
 * Clears search state and returns to the first page.
 */
const clearSearch = (): void => {
  searchDraft.value = "";
  submittedSearch.value = "";
  page.value = 1;
};

/**
 * Selects a user row and loads its detail panel.
 *
 * @param userId User UUID.
 */
const selectUser = (userId: string): void => {
  selectedUserId.value = userId;
};

/**
 * Starts the grant flow for the selected entitlement option.
 */
const openGrantModal = (): void => {
  if (!selectedFeatureKey.value) {
    actionError.value = "Selecione um entitlement antes de continuar.";
    return;
  }

  const option = ADMIN_ENTITLEMENT_OPTIONS.find((item) => item.value === selectedFeatureKey.value);
  pendingAction.value = {
    kind: "grant",
    featureKey: selectedFeatureKey.value,
    label: option?.label ?? selectedFeatureKey.value,
  };
  actionReason.value = "";
  actionError.value = "";
};

/**
 * Starts the revoke flow for one active entitlement.
 *
 * @param entitlement Entitlement selected for revocation.
 */
const openRevokeModal = (entitlement: AdminUserEntitlement): void => {
  pendingAction.value = {
    kind: "revoke",
    entitlementId: entitlement.id,
    label: entitlement.label,
  };
  actionReason.value = "";
  actionError.value = "";
};

/**
 * Closes the action modal when no mutation is pending.
 */
const closeActionModal = (): void => {
  if (isMutating.value) {
    return;
  }

  pendingAction.value = null;
  actionReason.value = "";
  actionError.value = "";
};

/**
 * Validates the required audit reason before mutation.
 *
 * @returns True when the reason is long enough.
 */
const validateReason = (): boolean => {
  if (actionReason.value.trim().length < 8) {
    actionError.value = "Informe um motivo claro com pelo menos 8 caracteres.";
    return false;
  }

  actionError.value = "";
  return true;
};

/**
 * Executes the pending grant or revoke action.
 */
const confirmAction = async (): Promise<void> => {
  if (!pendingAction.value || !selectedUserId.value || !validateReason()) {
    return;
  }

  const reason = actionReason.value.trim();

  try {
    const result = pendingAction.value.kind === "grant"
      ? await grantMutation.mutateAsync({
        userId: selectedUserId.value,
        featureKey: pendingAction.value.featureKey ?? "",
        reason,
      })
      : await revokeMutation.mutateAsync({
        entitlementId: pendingAction.value.entitlementId ?? "",
        reason,
      });

    lastAuditId.value = result.auditId;
    toast.success(
      pendingAction.value.kind === "grant"
        ? "Entitlement concedido com registro de auditoria."
        : "Entitlement revogado com registro de auditoria.",
    );
    closeActionModal();
  } catch {
    toast.error("Não foi possível concluir a ação administrativa. Tente novamente.");
  }
};

/**
 * Refreshes list and selected detail queries.
 */
const refreshUsers = (): void => {
  void usersQuery.refetch();

  if (selectedUserId.value) {
    void selectedUserQuery.refetch();
  }
};

/**
 * Formats an ISO datetime for operational display.
 *
 * @param value ISO datetime or null.
 * @returns Localized date-time label.
 */
const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

/**
 * Converts backend status codes into Portuguese labels.
 *
 * @param status Raw status code.
 * @returns Human-readable status label.
 */
const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: "Ativo",
    blocked: "Bloqueado",
    pending: "Pendente",
    deleted: "Removido",
    free: "Free",
    trialing: "Trial",
    past_due: "Pagamento pendente",
    canceled: "Cancelado",
    inactive: "Inativo",
  };

  return labels[status] ?? status;
};
</script>

<template>
  <section class="admin-users" aria-labelledby="admin-users-title">
    <div class="admin-users__hero">
      <div>
        <p class="admin-users__eyebrow">Operação de contas</p>
        <h2 id="admin-users-title">Usuários, assinaturas e acessos premium</h2>
        <p>
          Consulte usuários, valide o estado da assinatura e faça ajustes pontuais
          em entitlements com motivo obrigatório e rastreio de auditoria.
        </p>
      </div>
      <NButton secondary round :loading="usersQuery.isFetching.value" @click="refreshUsers">
        <template #icon>
          <RefreshCw :size="16" aria-hidden="true" />
        </template>
        Atualizar
      </NButton>
    </div>

    <div class="admin-users__metrics" aria-label="Resumo de usuários">
      <article class="admin-users__metric">
        <Users :size="20" aria-hidden="true" />
        <span>Base filtrada</span>
        <strong>{{ userCountLabel }}</strong>
      </article>
      <article class="admin-users__metric">
        <Crown :size="20" aria-hidden="true" />
        <span>Premium na busca</span>
        <strong>{{ premiumCount }}</strong>
      </article>
      <article class="admin-users__metric">
        <KeyRound :size="20" aria-hidden="true" />
        <span>Entitlements ativos</span>
        <strong>{{ entitlementCount }}</strong>
      </article>
    </div>

    <NAlert v-if="!canMutate" type="warning" class="admin-users__alert">
      As ações de grant/revoke estão em modo somente leitura para esta sessão.
      É necessário ter permissão admin e a flag <strong>web.admin.entitlement-mutations</strong> ativa.
    </NAlert>

    <div class="admin-users__workspace">
      <section class="admin-users__panel admin-users__panel--list" aria-label="Lista de usuários">
        <form class="admin-users__search" @submit.prevent="submitSearch">
          <NInput
            v-model:value="searchDraft"
            clearable
            placeholder="Buscar por email, nome ou ID"
            aria-label="Buscar usuário por email, nome ou ID"
          >
            <template #prefix>
              <Search :size="16" aria-hidden="true" />
            </template>
          </NInput>
          <NButton type="primary" attr-type="submit">Buscar</NButton>
          <NButton secondary :disabled="!submittedSearch && !searchDraft" @click="clearSearch">
            Limpar
          </NButton>
        </form>

        <div v-if="usersQuery.isLoading.value" class="admin-users__loading">
          <NSpin size="small" />
          Carregando usuários...
        </div>

        <NAlert v-else-if="usersQuery.isError.value" type="error">
          Não foi possível carregar usuários. Verifique sua conexão ou permissões admin.
        </NAlert>

        <div v-else-if="users.length === 0" class="admin-users__empty">
          <UserCheck :size="24" aria-hidden="true" />
          <strong>Nenhum usuário encontrado</strong>
          <span>Revise o termo de busca ou limpe os filtros.</span>
        </div>

        <div v-else class="admin-users__list">
          <button
            v-for="user in users"
            :key="user.id"
            type="button"
            class="admin-users__row"
            :class="{ 'admin-users__row--active': user.id === selectedUserId }"
            @click="selectUser(user.id)"
          >
            <span class="admin-users__avatar" aria-hidden="true">
              {{ user.name.slice(0, 1).toUpperCase() }}
            </span>
            <span class="admin-users__row-main">
              <strong>{{ user.name }}</strong>
              <small>{{ user.email }}</small>
            </span>
            <span class="admin-users__row-side">
              <span class="admin-users__pill" :data-status="user.subscriptionStatus">
                {{ user.subscriptionPlan }}
              </span>
              <small>{{ user.entitlementCount }} acessos</small>
            </span>
          </button>
        </div>

        <NPagination
          v-if="(usersQuery.data.value?.total ?? 0) > perPage"
          v-model:page="page"
          v-model:page-size="perPage"
          class="admin-users__pagination"
          :item-count="usersQuery.data.value?.total ?? 0"
          :page-sizes="[10, 20, 50]"
          show-size-picker
        />
      </section>

      <section class="admin-users__panel admin-users__panel--detail" aria-label="Detalhe do usuário">
        <div v-if="!selectedUserId" class="admin-users__empty admin-users__empty--detail">
          <ShieldCheck :size="26" aria-hidden="true" />
          <strong>Selecione um usuário</strong>
          <span>O detalhe de assinatura e entitlements aparecerá aqui.</span>
        </div>

        <div v-else-if="selectedUserQuery.isLoading.value" class="admin-users__loading">
          <NSpin size="small" />
          Carregando detalhe...
        </div>

        <NAlert v-else-if="selectedUserQuery.isError.value" type="error">
          Não foi possível carregar o detalhe deste usuário.
        </NAlert>

        <div v-else-if="selectedUser" class="admin-users__detail">
          <header class="admin-users__detail-header">
            <span class="admin-users__avatar admin-users__avatar--large" aria-hidden="true">
              {{ selectedUser.name.slice(0, 1).toUpperCase() }}
            </span>
            <div>
              <h3>{{ selectedUser.name }}</h3>
              <p>{{ selectedUser.email }}</p>
              <span class="admin-users__status">
                <CheckCircle2 v-if="selectedUser.status === 'active'" :size="14" aria-hidden="true" />
                <Ban v-else :size="14" aria-hidden="true" />
                {{ statusLabel(selectedUser.status) }}
              </span>
            </div>
          </header>

          <div class="admin-users__detail-grid">
            <article>
              <span>Cadastro</span>
              <strong>{{ formatDateTime(selectedUser.createdAt) }}</strong>
            </article>
            <article>
              <span>Último acesso</span>
              <strong>{{ formatDateTime(selectedUser.lastSeenAt) }}</strong>
            </article>
            <article>
              <span>Plano</span>
              <strong>{{ selectedUser.subscription?.planCode ?? selectedUser.subscriptionPlan }}</strong>
            </article>
            <article>
              <span>Status assinatura</span>
              <strong>{{ statusLabel(selectedUser.subscription?.status ?? selectedUser.subscriptionStatus) }}</strong>
            </article>
          </div>

          <section class="admin-users__section" aria-labelledby="admin-entitlements-title">
            <div class="admin-users__section-header">
              <div>
                <h4 id="admin-entitlements-title">Entitlements</h4>
                <p>Concessões ativas vinculadas ao usuário selecionado.</p>
              </div>
              <span class="admin-users__count">{{ activeEntitlements.length }}</span>
            </div>

            <div class="admin-users__grant">
              <NSelect
                v-model:value="selectedFeatureKey"
                :options="grantOptions"
                :disabled="!canMutate || isMutating"
                placeholder="Selecionar entitlement para conceder"
                aria-label="Selecionar entitlement para conceder"
              />
              <NButton
                type="primary"
                :disabled="!canMutate || !selectedFeatureKey"
                @click="openGrantModal"
              >
                <template #icon>
                  <KeyRound :size="16" aria-hidden="true" />
                </template>
                Conceder
              </NButton>
            </div>

            <div v-if="activeEntitlements.length === 0" class="admin-users__empty admin-users__empty--compact">
              <KeyRound :size="22" aria-hidden="true" />
              <span>Nenhum entitlement ativo.</span>
            </div>

            <ul v-else class="admin-users__entitlements">
              <li v-for="entitlement in activeEntitlements" :key="entitlement.id">
                <div>
                  <strong>{{ entitlement.label }}</strong>
                  <small>
                    {{ entitlement.featureKey }} · concedido em {{ formatDateTime(entitlement.grantedAt) }}
                  </small>
                </div>
                <NButton
                  size="small"
                  tertiary
                  type="error"
                  :disabled="!canMutate || isMutating"
                  :aria-label="`Revogar ${entitlement.label}`"
                  @click="openRevokeModal(entitlement)"
                >
                  <template #icon>
                    <XCircle :size="15" aria-hidden="true" />
                  </template>
                  Revogar
                </NButton>
              </li>
            </ul>
          </section>

          <section class="admin-users__section" aria-labelledby="admin-audit-title">
            <div class="admin-users__section-header">
              <div>
                <h4 id="admin-audit-title">Histórico resumido</h4>
                <p>Eventos recentes retornados pela API admin.</p>
              </div>
              <History :size="18" aria-hidden="true" />
            </div>

            <p v-if="lastAuditId" class="admin-users__audit-success" aria-live="polite">
              Último audit id: <strong>{{ lastAuditId }}</strong>
            </p>

            <ul v-if="selectedUser.auditEvents.length > 0" class="admin-users__audit-list">
              <li v-for="event in selectedUser.auditEvents" :key="event.id">
                <Clock3 :size="15" aria-hidden="true" />
                <span>
                  <strong>{{ event.action }}</strong>
                  <small>{{ event.reason ?? "Sem motivo informado" }} · {{ formatDateTime(event.createdAt) }}</small>
                </span>
              </li>
            </ul>
            <p v-else class="admin-users__muted">Nenhum evento recente retornado.</p>
          </section>
        </div>
      </section>
    </div>

    <NModal
      :show="Boolean(pendingAction)"
      :mask-closable="false"
      preset="card"
      class="admin-users-action-modal"
      @update:show="!$event && closeActionModal()"
    >
      <section v-if="pendingAction" class="admin-users-action">
        <header>
          <span class="admin-users-action__icon" aria-hidden="true">
            <KeyRound :size="20" />
          </span>
          <div>
            <h3>
              {{ pendingAction.kind === "grant" ? "Conceder entitlement" : "Revogar entitlement" }}
            </h3>
            <p>{{ pendingAction.label }}</p>
          </div>
        </header>

        <p>
          Esta ação altera o acesso do usuário e precisa de um motivo operacional.
          O motivo será enviado para auditoria junto da mutação.
        </p>

        <label class="admin-users-action__field">
          <span>Motivo da ação</span>
          <NInput
            v-model:value="actionReason"
            type="textarea"
            placeholder="Ex: ajuste solicitado pelo suporte após validação do pagamento"
            :autosize="{ minRows: 3, maxRows: 5 }"
            :disabled="isMutating"
            @update:value="actionError = ''"
          />
        </label>

        <p v-if="actionError" class="admin-users-action__error" role="alert">
          {{ actionError }}
        </p>

        <footer>
          <NButton :disabled="isMutating" @click="closeActionModal">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="isMutating"
            data-testid="admin-entitlement-confirm"
            @click="confirmAction"
          >
            Confirmar
          </NButton>
        </footer>
      </section>
    </NModal>
  </section>
</template>

<style scoped>
.admin-users {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 100%;
  overflow-x: hidden;
}

.admin-users *,
.admin-users *::before,
.admin-users *::after {
  box-sizing: border-box;
}

.admin-users__hero,
.admin-users__panel,
.admin-users__metric {
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.admin-users__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.admin-users__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-brand-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.admin-users__hero h2,
.admin-users__detail h3,
.admin-users__section h4,
.admin-users-action h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-heading);
}

.admin-users__hero h2 {
  font-size: clamp(1.75rem, 3vw, 2.35rem);
}

.admin-users__hero p,
.admin-users__section p,
.admin-users__detail-header p,
.admin-users__muted,
.admin-users-action p {
  color: var(--color-text-muted);
}

.admin-users__hero p {
  max-width: 760px;
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-md);
  line-height: 1.55;
}

.admin-users__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.admin-users__metric {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-users__metric svg {
  color: var(--color-brand-700);
}

.admin-users__metric span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.admin-users__metric strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.admin-users__alert {
  border-radius: var(--radius-lg);
}

.admin-users__workspace {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.25fr);
  gap: var(--space-4);
  align-items: start;
  min-width: 0;
  max-width: 100%;
}

.admin-users__panel {
  position: relative;
  min-width: 0;
  max-width: 100%;
  border-radius: var(--radius-lg);
  padding: var(--space-3);
}

.admin-users__panel--detail {
  z-index: 1;
}

.admin-users__search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.admin-users__loading,
.admin-users__empty {
  display: grid;
  place-items: center;
  gap: var(--space-1);
  min-height: 180px;
  color: var(--color-text-muted);
  text-align: center;
}

.admin-users__empty strong {
  color: var(--color-text-primary);
}

.admin-users__empty--compact {
  min-height: 96px;
  border: 1px dashed var(--color-outline-soft);
  border-radius: var(--radius-md);
}

.admin-users__list,
.admin-users__detail {
  display: grid;
  gap: var(--space-2);
}

.admin-users__row {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.admin-users__row--active {
  border-color: var(--color-brand-400);
  box-shadow: 0 0 0 3px var(--color-brand-glow-xs);
}

.admin-users__avatar {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--gradient-brand);
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-bold);
}

.admin-users__avatar--large {
  width: 56px;
  height: 56px;
  font-size: var(--font-size-xl);
}

.admin-users__row-main,
.admin-users__row-side {
  display: grid;
  gap: 2px;
}

.admin-users__row-main {
  min-width: 0;
}

.admin-users__row-main strong,
.admin-users__row-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-users__row-main small,
.admin-users__row-side small,
.admin-users__entitlements small,
.admin-users__audit-list small {
  color: var(--color-text-muted);
}

.admin-users__row-side {
  justify-items: end;
}

.admin-users__pill,
.admin-users__status,
.admin-users__count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.admin-users__pill {
  padding: 4px 8px;
  color: var(--color-brand-700);
  background: var(--color-brand-glow-xs);
}

.admin-users__pill[data-status="active"] {
  color: var(--color-positive-dark);
  background: var(--color-positive-glow);
}

.admin-users__pagination {
  margin-top: var(--space-3);
  justify-content: flex-end;
}

.admin-users__detail-header {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
}

.admin-users__detail-header p {
  margin: 4px 0 var(--space-1);
  overflow-wrap: anywhere;
}

.admin-users__status {
  padding: 4px 8px;
  color: var(--color-positive-dark);
  background: var(--color-positive-glow);
}

.admin-users__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}

.admin-users__detail-grid article {
  display: grid;
  gap: 4px;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.admin-users__detail-grid span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.admin-users__section {
  position: relative;
  z-index: 2;
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
}

.admin-users__section-header,
.admin-users__grant,
.admin-users__entitlements li,
.admin-users__audit-list li,
.admin-users-action header,
.admin-users-action footer {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.admin-users__section-header {
  justify-content: space-between;
  min-width: 0;
}

.admin-users__section-header p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.admin-users__section-header > div {
  min-width: 0;
}

.admin-users__count {
  padding: 6px 10px;
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
}

.admin-users__grant {
  align-items: stretch;
  min-width: 0;
}

.admin-users__grant :deep(.n-select) {
  min-width: 0;
  max-width: 100%;
  flex: 1;
}

.admin-users__entitlements,
.admin-users__audit-list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.admin-users__entitlements li {
  justify-content: space-between;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.admin-users__entitlements li > div {
  min-width: 0;
}

.admin-users__entitlements strong,
.admin-users__entitlements small,
.admin-users__audit-list strong,
.admin-users__audit-list small {
  display: block;
  overflow-wrap: anywhere;
}

.admin-users__audit-success {
  margin: 0;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-positive-dark);
  background: var(--color-positive-glow);
}

.admin-users__audit-list li {
  align-items: flex-start;
  color: var(--color-text-muted);
}

.admin-users__muted {
  margin: 0;
}

.admin-users-action {
  display: grid;
  gap: var(--space-3);
  width: min(100%, 560px);
}

.admin-users-action h3,
.admin-users-action p {
  margin: 0;
}

.admin-users-action__icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-text-on-brand);
  background: var(--gradient-brand);
}

.admin-users-action__field {
  display: grid;
  gap: var(--space-1);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.admin-users-action__error {
  color: var(--color-danger);
  font-weight: var(--font-weight-semibold);
}

.admin-users-action footer {
  justify-content: flex-end;
}

@media (max-width: 1080px) {
  .admin-users__metrics,
  .admin-users__detail-grid {
    grid-template-columns: 1fr;
  }

  .admin-users__workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .admin-users__panel {
    width: auto;
  }
}

@media (max-width: 680px) {
  .admin-users__hero {
    flex-direction: column;
    padding: var(--space-3);
  }

  .admin-users__search,
  .admin-users__row {
    grid-template-columns: 1fr;
  }

  .admin-users__row-side {
    justify-items: start;
  }

  .admin-users__grant,
  .admin-users__entitlements li {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-users__grant :deep(.n-select),
  .admin-users__grant :deep(.n-button) {
    width: 100%;
  }
}
</style>
