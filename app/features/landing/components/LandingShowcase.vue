<script setup lang="ts">
import { CreditCard, PiggyBank, Target, WalletCards, X } from "lucide-vue-next";
import type { Component } from "vue";
import {
  LANDING_FEATURES,
  LANDING_PAIN_POINTS,
  type LandingFeatureKey,
} from "../model/landing-content";
import LandingBrowserFrame from "./LandingBrowserFrame.vue";

const featureIcons: Record<LandingFeatureKey, Component> = {
  transactions: CreditCard,
  goals: Target,
  budgets: PiggyBank,
  wallet: WalletCards,
};

/**
 * Formats the 1-based feature position as a zero-padded ordinal ("01").
 *
 * @param index Zero-based index within the features list.
 * @returns Display ordinal for the feature card.
 */
const formatOrdinal = (index: number): string => String(index + 1).padStart(2, "0");
</script>

<template>
  <section
    class="landing-showcase"
    aria-labelledby="landing-showcase-title"
    data-testid="landing-features"
  >
    <div class="landing-showcase__inner">
      <div class="landing-showcase__narrative">
        <p class="landing-showcase__kicker">Do caos à clareza</p>
        <h2 id="landing-showcase-title" class="landing-showcase__title">
          A planilha quebrou. O app do banco só mostra o extrato.
        </h2>

        <ul class="landing-showcase__pains">
          <li v-for="pain in LANDING_PAIN_POINTS" :key="pain" class="landing-showcase__pain">
            <X :size="16" aria-hidden="true" />
            <span>{{ pain }}</span>
          </li>
        </ul>

        <p class="landing-showcase__solution">
          O Auraxis junta tudo em um lugar só — e devolve a visão do todo.
        </p>
      </div>

      <div class="landing-showcase__grid">
        <article
          v-for="(feature, index) in LANDING_FEATURES"
          :key="feature.key"
          class="landing-showcase__card"
        >
          <span class="landing-showcase__card-ordinal">{{ formatOrdinal(index) }}</span>
          <component :is="featureIcons[feature.key]" :size="22" aria-hidden="true" />
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </article>
      </div>

      <LandingBrowserFrame
        class="landing-showcase__frame"
        url="app.auraxis.com.br/goals"
        src="/landing/goals-light.png"
        alt="Tela de metas do Auraxis com três objetivos ativos, valores guardados, percentuais de progresso e aporte mensal sugerido"
      />
    </div>
  </section>
</template>

<style scoped>
.landing-showcase {
  position: relative;
  padding-block: clamp(var(--space-8), 9vw, 112px);
  border-top: 1px solid var(--landing-line-soft);
  background: linear-gradient(180deg, var(--landing-bg-raised), var(--landing-bg) 38%);
}

.landing-showcase__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(var(--space-6), 6vw, var(--space-9));
  align-items: start;
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
}

.landing-showcase__frame {
  grid-column: 1 / -1;
  margin-top: var(--space-3);
}

.landing-showcase__kicker {
  margin: 0 0 var(--space-3);
  color: var(--landing-green);
  font-family: var(--font-mono);
  font-size: var(--landing-size-kicker);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--landing-tracking-kicker);
  text-transform: uppercase;
}

.landing-showcase__title {
  margin: 0 0 var(--space-5);
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: var(--landing-leading-h2);
  letter-spacing: -0.01em;
}

.landing-showcase__pains {
  display: grid;
  gap: var(--space-3);
  margin: 0 0 var(--space-5);
  padding: 0;
  list-style: none;
}

.landing-showcase__pain {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

.landing-showcase__pain svg {
  flex: 0 0 auto;
  margin-top: 4px;
  padding: 2px;
  border-radius: var(--radius-xs);
  background: var(--color-negative-bg);
  color: #ff6f79;
}

.landing-showcase__solution {
  position: relative;
  margin: 0;
  padding-left: var(--space-4);
  color: var(--landing-ink);
  font-size: var(--landing-size-lead);
  font-weight: var(--font-weight-semibold);
  line-height: var(--landing-leading-body);
}

.landing-showcase__solution::before {
  content: "";
  position: absolute;
  inset: 2px auto 2px 0;
  width: 3px;
  border-radius: var(--landing-radius-pill);
  background: var(--landing-grad);
}

.landing-showcase__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.landing-showcase__card {
  position: relative;
  display: grid;
  gap: var(--space-3);
  align-content: start;
  padding: var(--space-5);
  border: 1px solid var(--landing-line-soft);
  border-radius: var(--landing-radius-card);
  background: color-mix(in srgb, var(--landing-surface) 72%, transparent);
  transition:
    border-color var(--motion-fast),
    transform var(--motion-fast);
}

.landing-showcase__card:hover {
  border-color: color-mix(in srgb, var(--landing-cyan) 34%, var(--landing-line-soft));
  transform: translateY(-2px);
}

.landing-showcase__card-ordinal {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  color: var(--landing-line);
  font-family: var(--font-mono);
  font-size: var(--landing-size-fine);
}

.landing-showcase__card svg {
  width: 40px;
  height: 40px;
  padding: 9px;
  border-radius: var(--radius-sm);
  background: rgba(68, 212, 255, 0.1);
  color: var(--landing-cyan);
}

.landing-showcase__card h3 {
  margin: 0;
  color: var(--landing-ink);
  font-size: var(--landing-size-h3);
  font-weight: var(--font-weight-semibold);
}

.landing-showcase__card p {
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

@media (max-width: 900px) {
  .landing-showcase__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .landing-showcase__inner {
    width: min(1120px, calc(100% - 24px));
  }

  .landing-showcase__grid {
    grid-template-columns: 1fr;
  }
}
</style>
