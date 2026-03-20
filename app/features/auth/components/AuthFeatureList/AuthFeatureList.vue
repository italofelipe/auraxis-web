<script setup lang="ts">
import type { AuthFeatureListProps, AuthFeature } from "./AuthFeatureList.types";

const DEFAULT_FEATURES: AuthFeature[] = [
  {
    icon: "📊",
    title: "Dashboard financeira",
    description: "Visão consolidada do seu mês com saldo, metas e patrimônio.",
  },
  {
    icon: "🎯",
    title: "Metas inteligentes",
    description: "Defina, acompanhe e conquiste metas financeiras com presets prontos.",
  },
  {
    icon: "💼",
    title: "Carteira & patrimônio",
    description: "Acompanhe seus investimentos com dados em tempo real via BRAPI.",
  },
  {
    icon: "🔒",
    title: "Segurança primeiro",
    description: "Seus dados protegidos com autenticação segura e criptografia.",
  },
];

const props = withDefaults(defineProps<AuthFeatureListProps>(), {
  features: () => DEFAULT_FEATURES,
});
</script>

<template>
  <ul class="auth-feature-list" aria-label="Benefícios do Auraxis">
    <li
      v-for="feature in props.features"
      :key="feature.title"
      class="auth-feature-list__item"
    >
      <span class="auth-feature-list__icon" aria-hidden="true">{{ feature.icon }}</span>
      <div class="auth-feature-list__text">
        <span class="auth-feature-list__title">{{ feature.title }}</span>
        <span class="auth-feature-list__desc">{{ feature.description }}</span>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.auth-feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-feature-list__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.auth-feature-list__icon {
  font-size: var(--font-size-xl);
  line-height: 1;
  flex-shrink: 0;
  margin-top: 2px;
}

.auth-feature-list__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.auth-feature-list__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.4;
}

.auth-feature-list__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
}
</style>
