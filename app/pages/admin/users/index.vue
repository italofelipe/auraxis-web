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
  Unlock,
  UserCheck,
  Users,
} from "lucide-vue-next";
import { NAlert, NButton, NDatePicker, NInput, NModal, NSelect, NSpin } from "naive-ui";

import { useToast } from "~/composables/useToast/useToast";
import type {
  AdminUserActionKind,
  AdminUserMutationInput,
  AdminUserMutationResult,
  AdminUserSource,
  AdminUserStatus,
} from "~/features/admin/users/model/admin-user";
import {
  useBlockAdminUserMutation,
  useGrantPremiumOverrideMutation,
  useRevokePremiumOverrideMutation,
  useUnblockAdminUserMutation,
} from "~/features/admin/users/queries/use-admin-user-mutations";
import { useAdminUserQuery } from "~/features/admin/users/queries/use-admin-user-query";
import { useAdminUsersQuery } from "~/features/admin/users/queries/use-admin-users-query";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Usuários e acessos",
  pageSubtitle: "Identidades v1/v2, bloqueio total e override premium auditável.",
});

useHead({ title: "Admin Usuários | Auraxis" });

const actionLabels: Record<AdminUserActionKind, string> = {
  block: "Bloquear conta",
  unblock: "Desbloquear conta",
  "premium-override": "Conceder premium",
  "premium-override-revoke": "Revogar override premium",
};

const toast = useToast();
const mutationsEnabled = useFeatureFlag("web.admin.user-mutations");
const searchDraft = ref("");
const submittedSearch = ref("");
const statusFilter = ref<AdminUserStatus | null>(null);
const sourceFilter = ref<AdminUserSource | null>(null);
const premiumFilter = ref<boolean | null>(null);
const cursor = ref<string | null>(null);
const cursorHistory = ref<Array<string | null>>([]);
const selectedUserRef = ref<string | null>(null);
const pendingAction = ref<AdminUserActionKind | null>(null);
const actionReason = ref("");
const actionExpiresAt = ref<number | null>(null);
const actionError = ref("");
const lastActionId = ref<string | null>(null);

const usersQuery = useAdminUsersQuery(() => ({
  search: submittedSearch.value,
  cursor: cursor.value,
  limit: 25,
  status: statusFilter.value ?? undefined,
  source: sourceFilter.value ?? undefined,
  premium: premiumFilter.value ?? undefined,
}));
const selectedUserQuery = useAdminUserQuery(selectedUserRef);
const blockMutation = useBlockAdminUserMutation();
const unblockMutation = useUnblockAdminUserMutation();
const grantPremiumMutation = useGrantPremiumOverrideMutation();
const revokePremiumMutation = useRevokePremiumOverrideMutation();

const users = computed(() => usersQuery.data.value?.users ?? []);
const selectedUser = computed(() => selectedUserQuery.data.value ?? null);
const nextCursor = computed(() => usersQuery.data.value?.nextCursor ?? null);
const isMutating = computed(() =>
  [blockMutation, unblockMutation, grantPremiumMutation, revokePremiumMutation].some(
    (mutation) => mutation.isPending.value,
  ),
);
const premiumCount = computed(() => users.value.filter((user) => user.premium).length);
const blockedCount = computed(() => users.value.filter((user) => user.status === "blocked").length);

const statusOptions = [
  { label: "Todos os estados", value: "" },
  { label: "Ativos", value: "active" },
  { label: "Bloqueados", value: "blocked" },
];
const sourceOptions = [
  { label: "Todas as origens", value: "" },
  { label: "API v1", value: "v1" },
  { label: "API v2", value: "v2" },
];
const premiumOptions = [
  { label: "Todos os acessos", value: "all" },
  { label: "Com premium", value: "premium" },
  { label: "Sem premium", value: "free" },
];
const premiumSelect = computed({
  get: (): string => {
    if (premiumFilter.value === null) {
      return "all";
    }
    return premiumFilter.value ? "premium" : "free";
  },
  set: (value: string): void => {
    premiumFilter.value = value === "all" ? null : value === "premium";
    resetCursor();
  },
});

watch(
  users,
  (currentUsers) => {
    if (currentUsers.length === 0) {
      selectedUserRef.value = null;
      return;
    }
    if (!selectedUserRef.value || !currentUsers.some((user) => user.id === selectedUserRef.value)) {
      selectedUserRef.value = currentUsers[0]?.id ?? null;
    }
  },
  { immediate: true },
);

watch(selectedUserRef, () => {
  lastActionId.value = null;
});

/** Resets the federated cursor whenever a filter changes. */
function resetCursor(): void {
  cursor.value = null;
  cursorHistory.value = [];
}

/** Applies the e-mail search and returns to the first cursor page. */
const submitSearch = (): void => {
  submittedSearch.value = searchDraft.value.trim();
  resetCursor();
};

/** Clears every list filter. */
const clearFilters = (): void => {
  searchDraft.value = "";
  submittedSearch.value = "";
  statusFilter.value = null;
  sourceFilter.value = null;
  premiumFilter.value = null;
  resetCursor();
};

/** Advances to the next federated cursor page. */
const goNext = (): void => {
  if (!nextCursor.value) {
    return;
  }
  cursorHistory.value.push(cursor.value);
  cursor.value = nextCursor.value;
};

/** Returns to the previously visited cursor page. */
const goPrevious = (): void => {
  cursor.value = cursorHistory.value.pop() ?? null;
};

/**
 * Opens a confirmation flow for an administrative action.
 *
 * @param kind Selected use case.
 */
const openAction = (kind: AdminUserActionKind): void => {
  pendingAction.value = kind;
  actionReason.value = "";
  actionExpiresAt.value = null;
  actionError.value = "";
};

/** Closes the confirmation modal when no request is active. */
const closeAction = (): void => {
  if (isMutating.value) {
    return;
  }
  pendingAction.value = null;
  actionReason.value = "";
  actionExpiresAt.value = null;
  actionError.value = "";
};

/**
 * Validates the audit reason and optional premium expiry.
 *
 * @returns True when the action can be sent.
 */
const validateAction = (): boolean => {
  const length = actionReason.value.trim().length;
  if (length < 8 || length > 500) {
    actionError.value = "O motivo deve ter entre 8 e 500 caracteres.";
    return false;
  }
  if (
    pendingAction.value === "premium-override" &&
    actionExpiresAt.value !== null &&
    actionExpiresAt.value <= Date.now()
  ) {
    actionError.value = "A expiração precisa estar no futuro.";
    return false;
  }
  actionError.value = "";
  return true;
};

/**
 * Dispatches the selected use case through its Vue Query mutation.
 *
 * @param kind Selected use case.
 * @param input Audited mutation input.
 * @returns Persisted action metadata.
 */
const executeAction = (
  kind: AdminUserActionKind,
  input: AdminUserMutationInput,
): Promise<AdminUserMutationResult> => {
  switch (kind) {
    case "block":
      return blockMutation.mutateAsync(input);
    case "unblock":
      return unblockMutation.mutateAsync(input);
    case "premium-override":
      return grantPremiumMutation.mutateAsync(input);
    case "premium-override-revoke":
      return revokePremiumMutation.mutateAsync(input);
    default:
      throw new Error("Ação administrativa inválida.");
  }
};

/** Confirms and submits the pending audited action. */
const confirmAction = async (): Promise<void> => {
  if (!selectedUserRef.value || !pendingAction.value || !validateAction()) {
    return;
  }
  const input: AdminUserMutationInput = {
    userRef: selectedUserRef.value,
    reason: actionReason.value.trim(),
    expiresAt:
      actionExpiresAt.value === null ? null : new Date(actionExpiresAt.value).toISOString(),
  };

  try {
    const result = await executeAction(pendingAction.value, input);
    lastActionId.value = result.actionId;
    if (result.status === "applied") {
      toast.success("Ação aplicada e registrada na auditoria.");
    } else {
      toast.warning("A ação está em reconciliação. O painel acompanhará o status.");
    }
    closeAction();
  } catch {
    toast.error("Não foi possível concluir a ação administrativa.");
  }
};

/** Refreshes the current list and selected detail. */
const refreshUsers = (): void => {
  void usersQuery.refetch();
  if (selectedUserRef.value) {
    void selectedUserQuery.refetch();
  }
};

/**
 * Formats an ISO timestamp for the operator locale.
 *
 * @param value ISO timestamp.
 * @returns Localized timestamp or fallback.
 */
const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

/**
 * Returns a concise Portuguese label for one audit action.
 *
 * @param action Backend action code.
 * @returns Human-readable label.
 */
const actionLabel = (action: string): string =>
  ({
    block: "Bloqueio",
    unblock: "Desbloqueio",
    premium_override: "Premium concedido",
    premium_override_revoke: "Premium revogado",
  })[action] ?? action;
</script>

<template>
  <section class="admin-users" aria-labelledby="admin-users-title">
    <header class="admin-users__hero">
      <div>
        <p class="admin-users__eyebrow">Control plane de identidades</p>
        <h2 id="admin-users-title">Usuários, bloqueios e premium</h2>
        <p>
          Visão unificada das identidades v1 e v2, sem misturar cobrança com concessões manuais.
        </p>
      </div>
      <NButton secondary round :loading="usersQuery.isFetching.value" @click="refreshUsers">
        <template #icon><RefreshCw :size="16" aria-hidden="true" /></template>
        Atualizar
      </NButton>
    </header>

    <div class="admin-users__metrics" aria-label="Resumo da página atual">
      <article>
        <Users :size="20" /><span>Nesta página</span><strong>{{ users.length }}</strong>
      </article>
      <article>
        <Crown :size="20" /><span>Com premium</span><strong>{{ premiumCount }}</strong>
      </article>
      <article>
        <Ban :size="20" /><span>Bloqueados</span><strong>{{ blockedCount }}</strong>
      </article>
    </div>

    <NAlert v-if="!mutationsEnabled" type="warning" class="admin-users__alert">
      Modo somente leitura. A flag <strong>web.admin.user-mutations</strong> está desativada; a
      autorização definitiva continua sendo validada pelo backend.
    </NAlert>

    <section class="admin-users__filters" aria-label="Filtros de usuários">
      <form class="admin-users__search" @submit.prevent="submitSearch">
        <NInput
          v-model:value="searchDraft"
          clearable
          placeholder="Buscar por e-mail"
          aria-label="Buscar usuário por e-mail"
        >
          <template #prefix><Search :size="16" aria-hidden="true" /></template>
        </NInput>
        <NButton type="primary" attr-type="submit">Buscar</NButton>
      </form>
      <NSelect
        :value="statusFilter ?? ''"
        :options="statusOptions"
        aria-label="Filtrar por estado"
        @update:value="
          statusFilter = $event || null;
          resetCursor();
        "
      />
      <NSelect
        :value="sourceFilter ?? ''"
        :options="sourceOptions"
        aria-label="Filtrar por origem"
        @update:value="
          sourceFilter = $event || null;
          resetCursor();
        "
      />
      <NSelect
        v-model:value="premiumSelect"
        :options="premiumOptions"
        aria-label="Filtrar premium"
      />
      <NButton secondary @click="clearFilters">Limpar</NButton>
    </section>

    <div class="admin-users__workspace">
      <section class="admin-users__panel" aria-label="Lista de usuários">
        <div v-if="usersQuery.isLoading.value" class="admin-users__state">
          <NSpin size="small" /> Carregando usuários...
        </div>
        <NAlert v-else-if="usersQuery.isError.value" type="error">
          Não foi possível carregar os usuários. Verifique a sessão administrativa.
        </NAlert>
        <div v-else-if="users.length === 0" class="admin-users__state">
          <UserCheck :size="24" /><strong>Nenhum usuário encontrado</strong>
        </div>
        <div v-else class="admin-users__list">
          <button
            v-for="user in users"
            :key="user.id"
            type="button"
            class="admin-users__row"
            :class="{ 'admin-users__row--active': user.id === selectedUserRef }"
            @click="selectedUserRef = user.id"
          >
            <span class="admin-users__avatar" aria-hidden="true">
              {{ user.email.slice(0, 1).toUpperCase() }}
            </span>
            <span class="admin-users__row-main">
              <strong>{{ user.email }}</strong>
              <small
                >{{ user.sources.join(" + ").toUpperCase() }} ·
                {{ formatDateTime(user.lastSeenAt) }}</small
              >
            </span>
            <span class="admin-users__row-side">
              <span class="admin-users__pill" :data-status="user.status">{{ user.status }}</span>
              <small>{{ user.premium ? "Premium" : "Free" }}</small>
            </span>
          </button>
        </div>
        <footer class="admin-users__pagination">
          <NButton secondary :disabled="cursorHistory.length === 0" @click="goPrevious"
            >Anterior</NButton
          >
          <span>Página {{ cursorHistory.length + 1 }}</span>
          <NButton secondary :disabled="!nextCursor" @click="goNext">Próxima</NButton>
        </footer>
      </section>

      <section class="admin-users__panel" aria-label="Detalhe do usuário">
        <div v-if="!selectedUserRef" class="admin-users__state">
          <ShieldCheck :size="26" /><strong>Selecione um usuário</strong>
        </div>
        <div v-else-if="selectedUserQuery.isLoading.value" class="admin-users__state">
          <NSpin size="small" /> Carregando detalhe...
        </div>
        <NAlert v-else-if="selectedUserQuery.isError.value" type="error">
          Não foi possível carregar o detalhe operacional.
        </NAlert>
        <div v-else-if="selectedUser" class="admin-users__detail">
          <header class="admin-users__detail-header">
            <span class="admin-users__avatar admin-users__avatar--large">
              {{ selectedUser.email.slice(0, 1).toUpperCase() }}
            </span>
            <div>
              <h3>{{ selectedUser.email }}</h3>
              <p>{{ selectedUser.id }}</p>
              <span class="admin-users__status" :data-status="selectedUser.status">
                <CheckCircle2 v-if="selectedUser.status === 'active'" :size="14" />
                <Ban v-else :size="14" />
                {{ selectedUser.status === "active" ? "Ativo" : "Bloqueado" }}
              </span>
            </div>
          </header>

          <div class="admin-users__actions">
            <NButton
              v-if="selectedUser.status === 'active'"
              type="error"
              :disabled="!mutationsEnabled"
              @click="openAction('block')"
              ><template #icon><Ban :size="16" /></template>Bloquear</NButton
            >
            <NButton
              v-else
              type="primary"
              :disabled="!mutationsEnabled"
              @click="openAction('unblock')"
              ><template #icon><Unlock :size="16" /></template>Desbloquear</NButton
            >
            <NButton
              v-if="!selectedUser.premiumOverrideActive"
              secondary
              :disabled="!mutationsEnabled"
              @click="openAction('premium-override')"
              ><template #icon><Crown :size="16" /></template>Conceder premium</NButton
            >
            <NButton
              v-else
              secondary
              type="warning"
              :disabled="!mutationsEnabled"
              @click="openAction('premium-override-revoke')"
              >Revogar override</NButton
            >
          </div>

          <section class="admin-users__section">
            <div class="admin-users__section-title">
              <div>
                <h4>Identidades vinculadas</h4>
                <p>Vínculo somente entre e-mails verificados.</p>
              </div>
              <span>{{ selectedUser.identities.length }}</span>
            </div>
            <ul class="admin-users__identities">
              <li
                v-for="identity in selectedUser.identities"
                :key="`${identity.source}/${identity.userId}`"
              >
                <header>
                  <strong>{{ identity.source.toUpperCase() }}</strong
                  ><code>{{ identity.userId }}</code>
                </header>
                <dl>
                  <div>
                    <dt>E-mail verificado</dt>
                    <dd>{{ identity.emailVerified ? "Sim" : "Não" }}</dd>
                  </div>
                  <div>
                    <dt>Autenticação</dt>
                    <dd>{{ identity.authMethods.join(", ") || "—" }}</dd>
                  </div>
                  <div>
                    <dt>Cadastro</dt>
                    <dd>{{ formatDateTime(identity.createdAt) }}</dd>
                  </div>
                  <div>
                    <dt>Último login</dt>
                    <dd>{{ formatDateTime(identity.lastLoginAt) }}</dd>
                  </div>
                  <div>
                    <dt>Assinatura</dt>
                    <dd>{{ identity.subscriptionStatus ?? "—" }}</dd>
                  </div>
                  <div>
                    <dt>Override premium</dt>
                    <dd>{{ identity.premiumOverrideActive ? "Ativo" : "Não" }}</dd>
                  </div>
                </dl>
                <NAlert v-if="identity.blockedAt" type="error">
                  Bloqueado em {{ formatDateTime(identity.blockedAt) }} ·
                  {{ identity.blockedReason ?? "Sem motivo" }}
                </NAlert>
              </li>
            </ul>
          </section>

          <section class="admin-users__section">
            <div class="admin-users__section-title">
              <div>
                <h4>Auditoria recente</h4>
                <p>Ações e estado de reconciliação.</p>
              </div>
              <History :size="18" />
            </div>
            <p v-if="lastActionId" class="admin-users__audit-success" aria-live="polite">
              Ação enviada: <strong>{{ lastActionId }}</strong>
            </p>
            <ul v-if="selectedUser.auditEvents.length" class="admin-users__audit-list">
              <li v-for="event in selectedUser.auditEvents" :key="event.id">
                <Clock3 :size="15" />
                <span
                  ><strong>{{ actionLabel(event.action) }} · {{ event.status }}</strong>
                  <small>{{ event.reason }} · {{ formatDateTime(event.createdAt) }}</small></span
                >
              </li>
            </ul>
            <p v-else class="admin-users__muted">Nenhuma ação administrativa recente.</p>
          </section>
        </div>
      </section>
    </div>

    <NModal
      :show="Boolean(pendingAction)"
      :mask-closable="false"
      preset="card"
      class="admin-users-action-modal"
      @update:show="!$event && closeAction()"
    >
      <section v-if="pendingAction" class="admin-users-action">
        <header>
          <span><KeyRound :size="20" /></span>
          <div>
            <h3>{{ actionLabels[pendingAction] }}</h3>
            <p>{{ selectedUser?.email }}</p>
          </div>
        </header>
        <NAlert :type="pendingAction === 'block' ? 'error' : 'info'">
          A ação será aplicada a todas as identidades verificadas vinculadas e ficará auditada.
        </NAlert>
        <label>
          <span>Motivo obrigatório</span>
          <NInput
            v-model:value="actionReason"
            type="textarea"
            maxlength="500"
            show-count
            :autosize="{ minRows: 3, maxRows: 6 }"
            :disabled="isMutating"
            placeholder="Descreva a justificativa operacional (8–500 caracteres)"
            @update:value="actionError = ''"
          />
        </label>
        <label v-if="pendingAction === 'premium-override'">
          <span>Expiração opcional</span>
          <NDatePicker
            v-model:value="actionExpiresAt"
            type="datetime"
            clearable
            :is-date-disabled="(timestamp: number) => timestamp < Date.now()"
          />
        </label>
        <p v-if="actionError" class="admin-users-action__error" role="alert">{{ actionError }}</p>
        <footer>
          <NButton :disabled="isMutating" @click="closeAction">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="isMutating"
            data-testid="admin-user-action-confirm"
            @click="confirmAction"
          >
            Confirmar ação
          </NButton>
        </footer>
      </section>
    </NModal>
  </section>
</template>

<style scoped>
.admin-users {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
.admin-users *,
.admin-users *::before,
.admin-users *::after {
  box-sizing: border-box;
}
.admin-users__hero,
.admin-users__filters,
.admin-users__panel,
.admin-users__metrics article {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}
.admin-users__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
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
  font-size: clamp(1.65rem, 3vw, 2.3rem);
}
.admin-users__hero p {
  max-width: 720px;
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}
.admin-users__eyebrow {
  margin: 0 0 var(--space-1) !important;
  color: var(--color-brand-700) !important;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.admin-users__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}
.admin-users__metrics article {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
}
.admin-users__metrics svg {
  color: var(--color-brand-700);
}
.admin-users__metrics span,
.admin-users__row small,
.admin-users__section p,
.admin-users__muted {
  color: var(--color-text-muted);
}
.admin-users__metrics strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}
.admin-users__filters {
  display: grid;
  grid-template-columns: minmax(280px, 1.5fr) repeat(3, minmax(150px, 0.65fr)) auto;
  gap: var(--space-2);
  padding: var(--space-3);
}
.admin-users__search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-2);
}
.admin-users__workspace {
  display: grid;
  grid-template-columns: minmax(340px, 0.85fr) minmax(0, 1.25fr);
  gap: var(--space-4);
  align-items: start;
}
.admin-users__panel {
  min-width: 0;
  padding: var(--space-3);
}
.admin-users__state {
  min-height: 180px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  text-align: center;
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
.admin-users__row:hover,
.admin-users__row--active {
  border-color: var(--color-brand-400);
}
.admin-users__row--active {
  box-shadow: 0 0 0 3px var(--color-brand-glow-xs);
}
.admin-users__avatar {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--gradient-brand);
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-bold);
}
.admin-users__avatar--large {
  width: 56px;
  height: 56px;
  font-size: var(--font-size-xl);
  flex: 0 0 auto;
}
.admin-users__row-main,
.admin-users__row-side {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.admin-users__row-main strong,
.admin-users__row-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-users__row-side {
  justify-items: end;
}
.admin-users__pill,
.admin-users__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--color-positive-glow);
  color: var(--color-positive-dark);
}
.admin-users__pill[data-status="blocked"],
.admin-users__status[data-status="blocked"] {
  background: var(--color-negative-glow);
  color: var(--color-negative-dark);
}
.admin-users__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: var(--space-3);
  color: var(--color-text-muted);
}
.admin-users__detail-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
.admin-users__detail-header > div {
  min-width: 0;
}
.admin-users__detail-header h3,
.admin-users__detail-header p {
  overflow-wrap: anywhere;
}
.admin-users__detail-header p {
  margin: 4px 0;
  color: var(--color-text-muted);
  font-family: monospace;
  font-size: var(--font-size-xs);
}
.admin-users__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}
.admin-users__section {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-outline-soft);
}
.admin-users__section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}
.admin-users__section-title p {
  margin: 4px 0 0;
}
.admin-users__section-title > span {
  min-width: 28px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-700);
  text-align: center;
  font-weight: var(--font-weight-bold);
}
.admin-users__identities,
.admin-users__audit-list {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}
.admin-users__identities > li {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.admin-users__identities header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  align-items: center;
}
.admin-users__identities code {
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-muted);
}
.admin-users__identities dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  margin: 0;
}
.admin-users__identities dl div {
  min-width: 0;
}
.admin-users__identities dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.admin-users__identities dd {
  margin: 2px 0 0;
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}
.admin-users__audit-list li {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.admin-users__audit-list span {
  min-width: 0;
  display: grid;
  gap: 3px;
}
.admin-users__audit-list small {
  overflow-wrap: anywhere;
}
.admin-users__audit-success {
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-positive-glow);
  color: var(--color-positive-dark) !important;
  overflow-wrap: anywhere;
}
:global(.admin-users-action-modal) {
  width: min(560px, calc(100vw - 32px));
}
.admin-users-action {
  display: grid;
  gap: var(--space-3);
}
.admin-users-action > header {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.admin-users-action > header > span {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-700);
}
.admin-users-action header p {
  margin: 3px 0 0;
  color: var(--color-text-muted);
}
.admin-users-action label {
  display: grid;
  gap: 6px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
.admin-users-action footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.admin-users-action__error {
  margin: 0;
  color: var(--color-negative-dark);
}
@media (max-width: 1100px) {
  .admin-users__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .admin-users__search {
    grid-column: 1 / -1;
  }
  .admin-users__workspace {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 680px) {
  .admin-users__hero {
    flex-direction: column;
    padding: var(--space-3);
  }
  .admin-users__metrics {
    grid-template-columns: 1fr;
  }
  .admin-users__filters {
    grid-template-columns: 1fr;
  }
  .admin-users__search {
    grid-template-columns: 1fr;
  }
  .admin-users__panel {
    padding: var(--space-2);
  }
  .admin-users__row {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .admin-users__row-side {
    grid-column: 2;
    justify-items: start;
  }
  .admin-users__identities dl {
    grid-template-columns: 1fr;
  }
  .admin-users__identities header {
    align-items: flex-start;
    flex-direction: column;
  }
  .admin-users__identities code {
    max-width: 100%;
  }
  .admin-users__actions {
    display: grid;
  }
  .admin-users__actions :deep(.n-button) {
    width: 100%;
  }
}
</style>
