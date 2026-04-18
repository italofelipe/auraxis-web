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
  <div class="auth-highlights" :aria-label="$t('authFeatureList.ariaLabel')">
    <article
      v-for="feature in features"
      :key="feature.title"
      class="auth-highlight"
    >
      <h3 class="auth-highlight__title">{{ feature.title }}</h3>
      <p class="auth-highlight__desc">{{ feature.description }}</p>
    </article>
  </div>
</template>

<style scoped>
.auth-highlights {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.auth-highlight {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.02);
  padding: var(--space-4);
}

.auth-highlight__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1) 0;
}

.auth-highlight__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.45;
}

@media (max-width: 1160px) {
  .auth-highlights {
    grid-template-columns: 1fr;
  }
}
</style>
