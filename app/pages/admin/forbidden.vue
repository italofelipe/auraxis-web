<script setup lang="ts">
import { LockKeyhole } from "lucide-vue-next";

definePageMeta({
  middleware: ["admin"],
  pageTitle: "Acesso restrito",
  pageSubtitle: "Área administrativa protegida",
});

useHead({ title: "Acesso restrito | Auraxis" });
</script>

<template>
  <section class="admin-forbidden" aria-labelledby="admin-forbidden-title">
    <UiSurfaceCard padding="lg" class="admin-forbidden__card">
      <div class="admin-forbidden__icon" aria-hidden="true">
        <LockKeyhole :size="36" />
      </div>
      <h1 id="admin-forbidden-title">Acesso restrito</h1>
      <p>
        Seu usuário está autenticado, mas não possui permissões administrativas
        para acessar este painel.
      </p>
      <NuxtLink class="admin-forbidden__action" to="/dashboard">
        Voltar ao dashboard
      </NuxtLink>
    </UiSurfaceCard>
  </section>
</template>

<style scoped>
.admin-forbidden {
  min-height: min(680px, calc(100vh - 160px));
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.admin-forbidden__card {
  width: min(100%, 560px);
  text-align: center;
}

.admin-forbidden__icon {
  width: 72px;
  height: 72px;
  margin: 0 auto var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: var(--color-warning-dark);
  background: var(--color-warning-glow);
}

.admin-forbidden h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
}

.admin-forbidden p {
  max-width: 420px;
  margin: var(--space-2) auto var(--space-4);
  color: var(--color-text-muted);
}

.admin-forbidden__action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-brand-600);
  color: var(--color-text-on-brand);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
}
</style>
