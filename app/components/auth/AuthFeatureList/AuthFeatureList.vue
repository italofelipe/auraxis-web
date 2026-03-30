<script setup lang="ts">
import { computed } from "vue";
import type { AuthFeatureListProps, AuthFeature } from "./AuthFeatureList.types";

const { t } = useI18n();

const props = defineProps<AuthFeatureListProps>();

/** Benefícios padrão exibidos quando a prop `features` é omitida. */
const DEFAULT_FEATURES = computed((): AuthFeature[] => [
  {
    icon: "📊",
    title: t("authFeatureList.features.dashboard.title"),
    description: t("authFeatureList.features.dashboard.description"),
  },
  {
    icon: "🎯",
    title: t("authFeatureList.features.goals.title"),
    description: t("authFeatureList.features.goals.description"),
  },
  {
    icon: "💼",
    title: t("authFeatureList.features.wallet.title"),
    description: t("authFeatureList.features.wallet.description"),
  },
  {
    icon: "🔒",
    title: t("authFeatureList.features.security.title"),
    description: t("authFeatureList.features.security.description"),
  },
]);

/** Lista de features resolvida: usa a prop quando fornecida, ou os defaults. */
const features = computed(() => props.features ?? DEFAULT_FEATURES.value);
</script>

<template>
  <ul class="auth-feature-list" :aria-label="$t('authFeatureList.ariaLabel')">
    <li
      v-for="feature in features"
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
