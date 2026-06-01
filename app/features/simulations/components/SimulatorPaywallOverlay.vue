<script setup lang="ts">
import { onMounted } from "vue";
import { NButton, NCard } from "naive-ui";

import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";

/**
 * Overlay de paywall exibido sobre o resultado borrado quando o free tier
 * esgota a quota mensal de simulações (#566). Não mata o cálculo — só obscurece
 * o número e oferece o upgrade.
 *
 * Emite `paywall_shown` ao montar e `upgrade_clicked` no CTA (catálogo PostHog).
 */
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    ctaLabel?: string;
    resetAt?: string | null;
  }>(),
  {
    title: "Você usou sua simulação gratuita do mês",
    description:
      "Faça upgrade para o Premium e simule seus cenários de metas quantas vezes quiser.",
    ctaLabel: "Fazer upgrade",
    resetAt: null,
  },
);

const emit = defineEmits<{ (event: "upgrade"): void }>();

const analytics = useAnalytics();

onMounted(() => {
  analytics.capture("paywall_shown", { feature: "goal_simulator", quota: 1 });
});

/** Emite o evento de conversão e propaga o `upgrade` para a página navegar. */
const onUpgrade = (): void => {
  analytics.capture("upgrade_clicked", {
    feature: "goal_simulator",
    source: "simulator_paywall",
  });
  emit("upgrade");
};
</script>

<template>
  <div class="simulator-paywall-overlay" data-testid="simulator-paywall-overlay">
    <NCard class="simulator-paywall-overlay__card" :bordered="true">
      <h3 class="simulator-paywall-overlay__title">{{ props.title }}</h3>
      <p class="simulator-paywall-overlay__description">{{ props.description }}</p>
      <NButton
        type="primary"
        size="large"
        data-testid="simulator-paywall-cta"
        @click="onUpgrade"
      >
        {{ props.ctaLabel }}
      </NButton>
    </NCard>
  </div>
</template>

<style scoped>
.simulator-paywall-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.25);
  z-index: 5;
}

.simulator-paywall-overlay__card {
  max-width: 22rem;
  text-align: center;
}

.simulator-paywall-overlay__title {
  margin: 0 0 0.5rem;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.simulator-paywall-overlay__description {
  margin: 0 0 1rem;
  opacity: 0.85;
}
</style>
