<script setup lang="ts">
import {
  Clock3,
  Eye,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-vue-next";
import { NButton, NInput, NSpin } from "naive-ui";

import type { AdminImpersonationUser } from "~/features/admin/impersonation/model/admin-impersonation";
import {
  useAdminImpersonationSession,
} from "~/features/admin/impersonation/composables/use-admin-impersonation-session";
import { useAdminImpersonationSearchQuery } from "~/features/admin/impersonation/queries/use-admin-impersonation-query";
import {
  useEndAdminImpersonationMutation,
  useStartAdminImpersonationMutation,
} from "~/features/admin/impersonation/queries/use-admin-impersonation-mutation";
import { useToast } from "~/composables/useToast/useToast";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Impersonação read-only",
  pageSubtitle: "Visualize a experiência do usuário sem permitir mutações e com trilha de auditoria.",
});

useHead({ title: "Admin Impersonação | Auraxis" });

const toast = useToast();
const { session, isActive, startLocalSession, clearLocalSession } = useAdminImpersonationSession();

const search = ref("");
const selectedUser = ref<AdminImpersonationUser | null>(null);
const reason = ref("");
const validationError = ref("");

const searchQuery = useAdminImpersonationSearchQuery(search);
const startMutation = useStartAdminImpersonationMutation();
const endMutation = useEndAdminImpersonationMutation();

const users = computed(() => searchQuery.data.value?.users ?? []);
const canStart = computed(() =>
  selectedUser.value !== null &&
  reason.value.trim().length >= 10 &&
  !startMutation.isPending.value,
);

watch(users, (currentUsers) => {
  if (currentUsers.length === 0) {
    selectedUser.value = null;
    return;
  }

  if (!selectedUser.value || !currentUsers.some((user) => user.id === selectedUser.value?.id)) {
    selectedUser.value = currentUsers[0] ?? null;
  }
});

/**
 * Selects a user for read-only impersonation.
 *
 * @param user User selected by the admin.
 * @returns Nothing.
 */
const selectUser = (user: AdminImpersonationUser): void => {
  selectedUser.value = user;
  validationError.value = "";
};

/**
 * Starts read-only impersonation after validating the audit reason.
 *
 * @returns Nothing.
 */
const startImpersonation = async (): Promise<void> => {
  if (!selectedUser.value) {
    validationError.value = "Selecione um usuário para visualizar.";
    return;
  }

  if (reason.value.trim().length < 10) {
    validationError.value = "Informe um motivo claro com pelo menos 10 caracteres.";
    return;
  }

  const nextSession = await startMutation.mutateAsync({
    userId: selectedUser.value.id,
    reason: reason.value.trim(),
  });

  startLocalSession(nextSession);
  toast.success("Modo somente leitura iniciado com auditoria.");
};

/**
 * Ends the current read-only impersonation session.
 *
 * @returns Nothing.
 */
const endImpersonation = async (): Promise<void> => {
  const activeSessionId = session.value?.sessionId;

  if (activeSessionId) {
    try {
      await endMutation.mutateAsync(activeSessionId);
    } catch {
      toast.warning("Sessão local encerrada; a API não confirmou o encerramento remoto.");
    }
  }

  clearLocalSession();
};

/**
 * Opens the app dashboard while impersonation is active.
 *
 * @returns Nothing.
 */
const openDashboard = (): void => {
  void navigateTo("/dashboard");
};

/**
 * Formats timestamps shown in the impersonation page.
 *
 * @param value ISO timestamp or null.
 * @returns Localized timestamp label.
 */
const formatDateTime = (value: string | null | undefined): string => {
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
  <section class="admin-impersonation" aria-labelledby="admin-impersonation-title">
    <div class="admin-impersonation__hero">
      <div>
        <p class="admin-impersonation__eyebrow">Suporte seguro</p>
        <h2 id="admin-impersonation-title">Visualizar como usuário, sem alterar dados</h2>
        <p>
          A sessão é curta, somente leitura e sinalizada por banner persistente.
          Toda abertura exige motivo operacional e audit id retornado pela API.
        </p>
      </div>
      <span class="admin-impersonation__badge">
        <LockKeyhole :size="18" aria-hidden="true" />
        Mutação bloqueada no cliente
      </span>
    </div>

    <section v-if="isActive && session" class="admin-impersonation__active" aria-label="Sessão ativa">
      <Eye :size="22" aria-hidden="true" />
      <div>
        <h3>Visualizando {{ session.userName }}</h3>
        <p>
          {{ session.userEmail }} · audit id {{ session.auditId ?? "pendente" }} · expira em
          {{ formatDateTime(session.expiresAt) }}
        </p>
      </div>
      <NButton type="primary" secondary @click="openDashboard">
        Abrir dashboard
      </NButton>
      <NButton tertiary :loading="endMutation.isPending.value" @click="endImpersonation">
        Encerrar
      </NButton>
    </section>

    <div class="admin-impersonation__content">
      <section class="admin-impersonation__search" aria-labelledby="admin-impersonation-search-title">
        <header>
          <div>
            <h3 id="admin-impersonation-search-title">Selecionar usuário</h3>
            <p>Busque por email, nome ou id. A API deve aplicar RBAC e auditoria no backend.</p>
          </div>
          <NButton secondary round :loading="searchQuery.isFetching.value" @click="searchQuery.refetch()">
            <template #icon>
              <RefreshCw :size="16" />
            </template>
            Atualizar
          </NButton>
        </header>

        <NInput v-model:value="search" clearable placeholder="Digite ao menos 2 caracteres">
          <template #prefix>
            <Search :size="16" />
          </template>
        </NInput>

        <NSpin :show="searchQuery.isFetching.value">
          <button
            v-for="user in users"
            :key="user.id"
            type="button"
            class="admin-impersonation__user"
            :class="{ 'admin-impersonation__user--active': user.id === selectedUser?.id }"
            @click="selectUser(user)"
          >
            <UserRound :size="18" aria-hidden="true" />
            <span>
              <strong>{{ user.name }}</strong>
              <small>{{ user.email }} · {{ user.planCode }}</small>
            </span>
          </button>

          <p v-if="search.trim().length >= 2 && !searchQuery.isFetching.value && users.length === 0">
            Nenhum usuário encontrado para a busca.
          </p>
        </NSpin>
      </section>

      <aside class="admin-impersonation__start" aria-label="Abrir visualização read-only">
        <ShieldCheck :size="24" aria-hidden="true" />
        <h3>Motivo obrigatório</h3>
        <p>
          Use este modo para suporte, reprodução de bug ou validação operacional.
          A sessão não substitui autorização backend nem permite escrita.
        </p>
        <NInput
          v-model:value="reason"
          type="textarea"
          placeholder="Ex: Reproduzir bug reportado no dashboard pelo usuário"
        />
        <p v-if="validationError" class="admin-impersonation__error">
          {{ validationError }}
        </p>
        <NButton
          type="primary"
          :disabled="!canStart"
          :loading="startMutation.isPending.value"
          @click="startImpersonation"
        >
          <template #icon>
            <Eye :size="16" />
          </template>
          Iniciar somente leitura
        </NButton>
        <div class="admin-impersonation__rules">
          <Clock3 :size="16" aria-hidden="true" />
          <span>Sessão curta, banner persistente e bloqueio local de POST/PATCH/PUT/DELETE.</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.admin-impersonation {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.admin-impersonation__hero,
.admin-impersonation__active,
.admin-impersonation__search,
.admin-impersonation__start,
.admin-impersonation__user {
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.admin-impersonation__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.admin-impersonation__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-brand-700);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.admin-impersonation h2,
.admin-impersonation h3 {
  margin: 0;
  font-family: var(--font-heading);
}

.admin-impersonation p,
.admin-impersonation small,
.admin-impersonation__rules {
  color: var(--color-text-muted);
}

.admin-impersonation__hero p {
  max-width: 760px;
  margin: var(--space-2) 0 0;
  font-size: var(--font-size-md);
}

.admin-impersonation__badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 10px var(--space-2);
  border-radius: var(--radius-full);
  color: var(--color-warning-dark);
  background: var(--color-warning-glow);
  font-weight: var(--font-weight-bold);
}

.admin-impersonation__active {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-impersonation__active svg,
.admin-impersonation__start > svg {
  color: var(--color-brand-700);
}

.admin-impersonation__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.55fr);
  gap: var(--space-3);
  align-items: start;
}

.admin-impersonation__search,
.admin-impersonation__start {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-impersonation__search header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.admin-impersonation__user {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.admin-impersonation__user + .admin-impersonation__user {
  margin-top: var(--space-1);
}

.admin-impersonation__user--active {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}

.admin-impersonation__user span,
.admin-impersonation__user small {
  min-width: 0;
  display: block;
}

.admin-impersonation__rules {
  display: flex;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
}

.admin-impersonation__error {
  color: var(--color-danger-dark);
}

@media (max-width: 980px) {
  .admin-impersonation__hero,
  .admin-impersonation__search header {
    flex-direction: column;
    padding: var(--space-3);
  }

  .admin-impersonation__content,
  .admin-impersonation__active {
    grid-template-columns: 1fr;
  }
}
</style>
