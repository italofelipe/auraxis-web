<script setup lang="ts">
import { computed, useSlots } from "vue";
import { Calculator, FileText, LineChart, ShieldCheck } from "lucide-vue-next";

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
  contextLabel: string;
  contextValue: string;
  contextHelper: string;
  hasResult: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyTitle: "Calcule para ver o painel completo",
  emptyDescription: "Os resultados aparecem com cartões, detalhamento e memória de cálculo assim que a simulação é executada.",
});

const slots = useSlots();

const hasFormulaSlot = computed(() => Boolean(slots.formula));
const hasActionsSlot = computed(() => Boolean(slots.actions));
</script>

<template>
  <div class="labor-calculator-market-pulse">
    <section
      class="labor-calculator-market-pulse__hero"
      aria-labelledby="labor-calculator-market-pulse-title"
    >
      <div class="labor-calculator-market-pulse__hero-copy">
        <span class="labor-calculator-market-pulse__eyebrow">
          <Calculator :size="16" aria-hidden="true" />
          {{ props.eyebrow }}
        </span>
        <h1 id="labor-calculator-market-pulse-title">
          {{ props.title }}
        </h1>
        <p>{{ props.subtitle }}</p>
      </div>

      <aside class="labor-calculator-market-pulse__hero-panel" aria-label="Contexto do cálculo">
        <span>{{ props.contextLabel }}</span>
        <strong>{{ props.contextValue }}</strong>
        <small>{{ props.contextHelper }}</small>
      </aside>
    </section>

    <div class="labor-calculator-market-pulse__layout">
      <section class="labor-calculator-market-pulse__form-panel" aria-label="Dados do cálculo">
        <slot name="form" />
      </section>

      <section class="labor-calculator-market-pulse__results-panel" aria-label="Resultados do cálculo">
        <div class="labor-calculator-market-pulse__section-heading">
          <LineChart :size="18" aria-hidden="true" />
          <div>
            <h2>Market Pulse</h2>
            <p>Resumo executivo, componentes do cálculo e sinais úteis para conferência.</p>
          </div>
        </div>

        <div class="labor-calculator-market-pulse__results-grid">
          <slot v-if="props.hasResult" name="results" />
          <div v-else class="labor-calculator-market-pulse__empty">
            <FileText :size="28" aria-hidden="true" />
            <strong>{{ props.emptyTitle }}</strong>
            <p>{{ props.emptyDescription }}</p>
          </div>
        </div>

        <section
          v-if="props.hasResult"
          class="labor-calculator-market-pulse__breakdown"
          aria-label="Detalhamento"
        >
          <div class="labor-calculator-market-pulse__section-heading">
            <FileText :size="18" aria-hidden="true" />
            <div>
              <h2>Detalhamento</h2>
              <p>Memória de valores para auditoria rápida da simulação.</p>
            </div>
          </div>
          <slot name="breakdown" />
        </section>

        <section class="labor-calculator-market-pulse__scenario-rail" aria-label="Projeção visual">
          <div class="labor-calculator-market-pulse__scenario-header">
            <span>Projeção visual</span>
            <strong>{{ props.hasResult ? "Atualizada" : "Aguardando cálculo" }}</strong>
          </div>
          <div class="labor-calculator-market-pulse__rail" aria-hidden="true">
            <span class="labor-calculator-market-pulse__rail-fill" />
          </div>
          <slot name="scenario" />
        </section>
      </section>
    </div>

    <div
      v-if="hasFormulaSlot || hasActionsSlot"
      class="labor-calculator-market-pulse__support-grid"
    >
      <section
        v-if="hasFormulaSlot"
        class="labor-calculator-market-pulse__formula"
        aria-label="Memória de cálculo"
      >
        <div class="labor-calculator-market-pulse__section-heading">
          <ShieldCheck :size="18" aria-hidden="true" />
          <div>
            <h2>Memória de cálculo</h2>
            <p>Premissas, fórmulas e bases legais usadas nesta calculadora.</p>
          </div>
        </div>
        <slot name="formula" />
      </section>

      <aside
        v-if="hasActionsSlot"
        class="labor-calculator-market-pulse__actions"
        aria-label="Ações e próximos passos"
      >
        <slot name="actions" />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.labor-calculator-market-pulse {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 28px;
  color: var(--color-text-primary);
}

.labor-calculator-market-pulse__hero,
.labor-calculator-market-pulse__form-panel,
.labor-calculator-market-pulse__results-panel,
.labor-calculator-market-pulse__breakdown,
.labor-calculator-market-pulse__scenario-rail,
.labor-calculator-market-pulse__formula,
.labor-calculator-market-pulse__actions {
  border: 1px solid var(--color-outline-soft);
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.08), rgba(139, 125, 255, 0.04)),
    var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.labor-calculator-market-pulse__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
  gap: 24px;
  align-items: end;
  padding: 28px;
  border-radius: var(--radius-lg);
}

.labor-calculator-market-pulse__hero-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.labor-calculator-market-pulse__eyebrow,
.labor-calculator-market-pulse__section-heading {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--color-brand-300);
}

.labor-calculator-market-pulse__eyebrow {
  width: fit-content;
  align-items: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.labor-calculator-market-pulse__hero h1 {
  max-width: 780px;
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-4xl);
  line-height: 1;
  letter-spacing: 0;
}

.labor-calculator-market-pulse__hero p,
.labor-calculator-market-pulse__section-heading p,
.labor-calculator-market-pulse__empty p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.labor-calculator-market-pulse__hero-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: rgba(5, 7, 13, 0.45);
}

.labor-calculator-market-pulse__hero-panel span,
.labor-calculator-market-pulse__scenario-header span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0;
  text-transform: uppercase;
}

.labor-calculator-market-pulse__hero-panel strong {
  color: var(--color-brand-300);
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
}

.labor-calculator-market-pulse__hero-panel small {
  color: var(--color-text-subtle);
  line-height: 1.45;
}

.labor-calculator-market-pulse__layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.74fr) minmax(0, 1.26fr);
  gap: 24px;
  align-items: start;
}

.labor-calculator-market-pulse__form-panel,
.labor-calculator-market-pulse__results-panel,
.labor-calculator-market-pulse__breakdown,
.labor-calculator-market-pulse__scenario-rail,
.labor-calculator-market-pulse__formula,
.labor-calculator-market-pulse__actions {
  border-radius: var(--radius-lg);
}

.labor-calculator-market-pulse__form-panel,
.labor-calculator-market-pulse__results-panel,
.labor-calculator-market-pulse__formula,
.labor-calculator-market-pulse__actions {
  padding: 24px;
}

.labor-calculator-market-pulse__results-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.labor-calculator-market-pulse__section-heading h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  letter-spacing: 0;
}

.labor-calculator-market-pulse__results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.labor-calculator-market-pulse__results-grid :deep(.ui-sticky-summary-card),
.labor-calculator-market-pulse__results-grid :deep(.calculator-result-summary),
.labor-calculator-market-pulse__results-grid :deep(.ui-surface-card) {
  height: 100%;
}

.labor-calculator-market-pulse__results-grid :deep(.calculator-result-summary),
.labor-calculator-market-pulse__results-grid :deep(.ui-surface-card),
.labor-calculator-market-pulse__empty {
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-md);
  background: rgba(5, 7, 13, 0.35);
}

.labor-calculator-market-pulse__empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.labor-calculator-market-pulse__empty svg {
  color: var(--color-brand-300);
}

.labor-calculator-market-pulse__empty strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.labor-calculator-market-pulse__breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: rgba(14, 21, 35, 0.92);
}

.labor-calculator-market-pulse__breakdown :deep(.ui-surface-card),
.labor-calculator-market-pulse__actions :deep(.ui-surface-card) {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.labor-calculator-market-pulse__scenario-rail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: rgba(5, 7, 13, 0.36);
}

.labor-calculator-market-pulse__scenario-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.labor-calculator-market-pulse__scenario-header strong {
  color: var(--color-brand-300);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.labor-calculator-market-pulse__rail {
  height: 10px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
}

.labor-calculator-market-pulse__rail-fill {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-brand-500), var(--color-positive));
  box-shadow: var(--shadow-brand-glow-sm);
}

.labor-calculator-market-pulse__support-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 24px;
  align-items: start;
}

.labor-calculator-market-pulse__formula,
.labor-calculator-market-pulse__actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.labor-calculator-market-pulse :deep(.n-button--primary-type),
.labor-calculator-market-pulse :deep(.n-button.n-button--primary-type) {
  box-shadow: var(--shadow-brand-glow-sm);
}

@media (max-width: 1080px) {
  .labor-calculator-market-pulse__layout,
  .labor-calculator-market-pulse__support-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .labor-calculator-market-pulse {
    gap: 16px;
    padding: 16px;
  }

  .labor-calculator-market-pulse__hero,
  .labor-calculator-market-pulse__results-grid {
    grid-template-columns: 1fr;
  }

  .labor-calculator-market-pulse__hero,
  .labor-calculator-market-pulse__form-panel,
  .labor-calculator-market-pulse__results-panel,
  .labor-calculator-market-pulse__formula,
  .labor-calculator-market-pulse__actions {
    padding: 18px;
  }

  .labor-calculator-market-pulse__hero h1 {
    font-size: var(--font-size-3xl);
  }
}
</style>
