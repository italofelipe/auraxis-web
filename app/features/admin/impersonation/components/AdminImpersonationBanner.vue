<script setup lang="ts">
import { Eye, X } from "lucide-vue-next";

import { useAdminImpersonationSession } from "~/features/admin/impersonation/composables/use-admin-impersonation-session";

const { session, isActive, clearLocalSession } = useAdminImpersonationSession();

const expiresAtLabel = computed(() => {
  if (!session.value?.expiresAt) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(session.value.expiresAt));
});
</script>

<template>
  <section v-if="isActive && session" class="admin-impersonation-banner" aria-live="polite">
    <div>
      <Eye :size="18" aria-hidden="true" />
      <p>
        <strong>Visualizando como {{ session.userName }}</strong>
        <span>
          {{ session.userEmail }} · modo somente leitura até {{ expiresAtLabel }}
        </span>
      </p>
    </div>
    <button type="button" @click="clearLocalSession">
      <X :size="16" aria-hidden="true" />
      Encerrar
    </button>
  </section>
</template>

<style scoped>
.admin-impersonation-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 10px var(--space-4);
  color: var(--color-warning-dark);
  background: var(--color-warning-glow);
  border-bottom: 1px solid var(--color-warning-border);
}

.admin-impersonation-banner > div,
.admin-impersonation-banner button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.admin-impersonation-banner p {
  margin: 0;
}

.admin-impersonation-banner strong,
.admin-impersonation-banner span {
  display: block;
}

.admin-impersonation-banner span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.admin-impersonation-banner button {
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-full);
  padding: 6px 10px;
  color: inherit;
  background: var(--color-bg-surface);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
}

@media (max-width: 680px) {
  .admin-impersonation-banner {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
