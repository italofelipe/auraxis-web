<script setup lang="ts">
import CheckoutButton from "~/features/subscription/components/CheckoutButton.vue";
import PlanCard from "~/features/subscription/components/PlanCard.vue";

const freePlanFeatures = [
  "Simulações básicas",
  "Visualização de carteira",
];

const premiumPlanFeatures = [
  "Simulações avançadas",
  "Exportar PDF",
  "Entradas compartilhadas",
  "Alertas avançados",
];
</script>

<template>
  <div class="planos-page">
    <header class="planos-page__header">
      <p class="planos-page__eyebrow">Planos</p>
      <h1>Escolha o plano ideal para você</h1>
      <p class="planos-page__subtitle">
        Comece gratuitamente e faça upgrade quando precisar de mais controle.
      </p>
    </header>

    <div class="planos-page__grid">
      <PlanCard
        plan-slug="free"
        name="Free"
        price-label="Grátis"
        :features="freePlanFeatures"
      />

      <div class="planos-page__premium-col">
        <PlanCard
          plan-slug="premium"
          name="Premium"
          price-label="R$ 29,90/mês"
          :features="premiumPlanFeatures"
        />
        <CheckoutButton plan-slug="premium" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.planos-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
  max-width: 960px;
  margin-inline: auto;
}

.planos-page__header {
  text-align: center;
}

.planos-page__eyebrow {
  margin: 0 0 var(--space-1);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--font-size-body-sm);
  color: var(--color-brand-500);
  font-weight: var(--font-weight-semibold);
}

.planos-page__header h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  line-height: var(--line-height-heading-lg);
}

.planos-page__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-neutral-700, #444);
}

.planos-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4, 16px);
  align-items: start;
}

.planos-page__premium-col {
  display: grid;
  gap: var(--space-2, 8px);
}
</style>
