<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import {
  LANDING_PLANS,
  LANDING_REGISTER_URL,
  LANDING_SUBSCRIBE_URL,
} from "../model/landing-content";
</script>

<template>
  <section
    class="landing-pricing"
    aria-labelledby="landing-pricing-title"
    data-testid="landing-pricing"
  >
    <div class="landing-pricing__inner">
      <p class="landing-pricing__kicker">Planos</p>
      <h2 id="landing-pricing-title" class="landing-pricing__title">
        Um preço justo para ter o controle de volta.
      </h2>
      <p class="landing-pricing__lead">
        Comece com 7 dias grátis. Depois, escolha o plano que cabe no seu mês —
        IA, metas, orçamentos e carteira, tudo incluído.
      </p>

      <ul class="landing-pricing__plans" role="list">
        <li
          v-for="plan in LANDING_PLANS"
          :key="plan.key"
          class="landing-pricing__plan"
          :class="{ 'landing-pricing__plan--featured': plan.featured }"
        >
          <span v-if="plan.featured" class="landing-pricing__badge">
            Recomendado
          </span>
          <h3 class="landing-pricing__plan-name">{{ plan.name }}</h3>
          <p class="landing-pricing__price">
            <span class="landing-pricing__amount">{{ plan.price }}</span>
            <span class="landing-pricing__period">{{ plan.period }}</span>
          </p>
          <p class="landing-pricing__note">{{ plan.note }}</p>
        </li>
      </ul>

      <div class="landing-pricing__actions">
        <a
          :href="LANDING_SUBSCRIBE_URL"
          class="landing-pricing__button"
          data-testid="landing-pricing-subscribe"
        >
          Assinar Premium
          <ArrowRight :size="17" aria-hidden="true" />
        </a>
        <p class="landing-pricing__free">
          7 dias grátis para experimentar.
          <a :href="LANDING_REGISTER_URL">Começar grátis</a>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-pricing {
  position: relative;
  overflow: hidden;
  padding-block: clamp(var(--space-8), 9vw, 112px);
  border-top: 1px solid var(--landing-line-soft);
  background:
    radial-gradient(52% 62% at 50% -8%, rgba(68, 212, 255, 0.14), transparent 70%),
    var(--landing-bg);
}

.landing-pricing__inner {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  width: min(920px, calc(100% - 40px));
  margin-inline: auto;
  text-align: center;
}

.landing-pricing__kicker {
  margin: 0;
  color: var(--landing-cyan);
  font-size: var(--landing-size-kicker);
  font-weight: var(--font-weight-semibold);
  letter-spacing: var(--landing-tracking-kicker);
  text-transform: uppercase;
}

.landing-pricing__title {
  margin: 0;
  max-width: 18ch;
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: var(--landing-leading-h2);
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.landing-pricing__lead {
  margin: 0;
  max-width: 56ch;
  color: var(--landing-body);
  font-size: var(--landing-size-lead);
  line-height: var(--landing-leading-body);
}

.landing-pricing__plans {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  width: 100%;
  margin: var(--space-4) 0 0;
  padding: 0;
  list-style: none;
}

.landing-pricing__plan {
  position: relative;
  display: grid;
  gap: var(--space-2);
  align-content: start;
  padding: var(--space-6) var(--space-5);
  border: 1px solid var(--landing-line);
  border-radius: var(--landing-radius-card);
  background: var(--landing-surface);
  text-align: left;
}

.landing-pricing__plan--featured {
  border-color: var(--landing-cyan);
  box-shadow: var(--landing-shadow-frame);
}

.landing-pricing__badge {
  position: absolute;
  top: calc(var(--space-3) * -1);
  right: var(--space-5);
  padding: 4px var(--space-3);
  border-radius: var(--landing-radius-pill);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-size: var(--landing-size-fine);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.landing-pricing__plan-name {
  margin: 0;
  color: var(--landing-ink);
  font-size: var(--landing-size-h3);
  font-weight: var(--font-weight-semibold);
}

.landing-pricing__price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-2);
  margin: 0;
}

.landing-pricing__amount {
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: 1.05;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.landing-pricing__period {
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
  white-space: nowrap;
}

.landing-pricing__note {
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

.landing-pricing__actions {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.landing-pricing__button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 52px;
  padding-inline: var(--space-6);
  border-radius: var(--landing-radius-pill);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  box-shadow: var(--landing-shadow-cta);
  transition:
    transform var(--motion-fast),
    filter var(--motion-fast);
}

.landing-pricing__button:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.landing-pricing__button:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
}

.landing-pricing__free {
  margin: 0;
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
}

.landing-pricing__free a {
  color: var(--landing-cyan);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.landing-pricing__free a:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
  border-radius: var(--radius-xs);
}

@media (max-width: 640px) {
  .landing-pricing__inner {
    width: min(920px, calc(100% - 24px));
  }

  .landing-pricing__plans {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-pricing__button {
    transition: none;
  }

  .landing-pricing__button:hover {
    transform: none;
  }
}
</style>
