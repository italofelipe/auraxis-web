<script setup lang="ts">
import { AlertTriangle, Database, LockKeyhole, ShieldCheck } from "lucide-vue-next";

definePageMeta({
  layout: "admin",
  middleware: ["admin"],
  pageTitle: "Console administrativo",
  pageSubtitle: "Controle operacional protegido por permissões admin.",
});

useHead({ title: "Admin | Auraxis" });

const readinessCards = [
  {
    label: "Usuários e assinaturas",
    value: "Preparado",
    text: "O shell já reserva o módulo para busca, detalhe e ações auditáveis assim que a API v2 expor os endpoints.",
    icon: ShieldCheck,
  },
  {
    label: "Insights IA",
    value: "Preparado",
    text: "A área admin separa histórico, consentimento, modelo, tokens e custo para a próxima etapa.",
    icon: Database,
  },
  {
    label: "Ações sensíveis",
    value: "Bloqueadas",
    text: "Nenhuma mutação administrativa é exposta enquanto RBAC e audit trail não estiverem completos.",
    icon: LockKeyhole,
  },
] as const;
</script>

<template>
  <section class="admin-overview" aria-labelledby="admin-overview-title">
    <div class="admin-overview__hero">
      <div>
        <p class="admin-overview__eyebrow">Operação interna</p>
        <h2 id="admin-overview-title">Visão operacional da plataforma</h2>
        <p>
          Esta primeira versão entrega a estrutura segura do painel admin: rota protegida,
          navegação própria e estados explícitos enquanto os módulos de dados chegam pela API v2.
        </p>
      </div>
      <div class="admin-overview__hero-badge" aria-label="Acesso validado">
        <ShieldCheck :size="22" aria-hidden="true" />
        Admin validado
      </div>
    </div>

    <div class="admin-overview__grid">
      <article
        v-for="card in readinessCards"
        :key="card.label"
        class="admin-overview__card"
      >
        <span class="admin-overview__card-icon" aria-hidden="true">
          <component :is="card.icon" :size="20" />
        </span>
        <div>
          <p>{{ card.label }}</p>
          <strong>{{ card.value }}</strong>
          <span>{{ card.text }}</span>
        </div>
      </article>
    </div>

    <section class="admin-overview__notice" aria-label="Próximos módulos admin">
      <AlertTriangle :size="22" aria-hidden="true" />
      <div>
        <h3>Módulos em modo leitura estrutural</h3>
        <p>
          Usuários, insights, feature flags e auditoria aparecem na navegação como próximos passos,
          mas permanecem inativos para evitar qualquer promessa de controle antes dos endpoints admin.
        </p>
      </div>
    </section>
  </section>
</template>

<style scoped>
.admin-overview {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-overview__hero,
.admin-overview__notice,
.admin-overview__card {
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.admin-overview__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.admin-overview__eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-brand-700);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
}

.admin-overview__hero h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(1.75rem, 3vw, 2.5rem);
}

.admin-overview__hero p {
  max-width: 720px;
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}

.admin-overview__hero-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 10px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-positive-glow);
  color: var(--color-positive-dark);
  font-weight: var(--font-weight-bold);
}

.admin-overview__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.admin-overview__card {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.admin-overview__card-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-brand-700);
}

.admin-overview__card p,
.admin-overview__card strong,
.admin-overview__card span {
  display: block;
}

.admin-overview__card p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.admin-overview__card strong {
  margin-top: 2px;
  font-size: var(--font-size-xl);
}

.admin-overview__card span {
  margin-top: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.admin-overview__notice {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  color: var(--color-warning-dark);
  background: var(--color-warning-glow);
}

.admin-overview__notice h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.admin-overview__notice p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

@media (max-width: 920px) {
  .admin-overview__hero {
    flex-direction: column;
    padding: var(--space-3);
  }

  .admin-overview__grid {
    grid-template-columns: 1fr;
  }
}
</style>
