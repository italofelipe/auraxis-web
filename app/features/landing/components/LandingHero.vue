<script setup lang="ts">
import { ShieldCheck } from "lucide-vue-next";
import { useLandingCtaTracking } from "../composables/useLandingCtaTracking";
import { LANDING_REGISTER_URL } from "../model/landing-content";
import LandingBrowserFrame from "./LandingBrowserFrame.vue";

const { trackCta } = useLandingCtaTracking();
</script>

<template>
  <section class="landing-hero" aria-labelledby="landing-hero-title" data-testid="landing-hero">
    <div class="landing-hero__inner">
      <p class="landing-hero__kicker">Planner financeiro inteligente</p>

      <h1 id="landing-hero-title" class="landing-hero__title">
        Do caos financeiro à clareza, <span class="landing-hero__title-accent">com IA</span> do seu
        lado.
      </h1>

      <p class="landing-hero__lead">
        O Auraxis reúne transações, cartões, metas, orçamentos e carteira em um só lugar — e usa
        inteligência artificial para mostrar para onde o seu dinheiro está indo antes que vire
        problema.
      </p>

      <div class="landing-hero__actions">
        <a
          :href="LANDING_REGISTER_URL"
          class="landing-hero__cta"
          data-testid="landing-cta-register"
          @click="trackCta('hero-register', LANDING_REGISTER_URL)"
        >
          Criar conta gratuita
        </a>
        <p class="landing-hero__note">
          <ShieldCheck :size="15" aria-hidden="true" />
          Grátis para começar. Seus dados não treinam modelos.
        </p>
      </div>

      <div class="landing-hero__frame" data-testid="landing-hero-shot">
        <LandingBrowserFrame
          url="app.auraxis.com.br/dashboard"
          src="/landing/dashboard-light.webp"
          alt="Painel do Auraxis com resumo do mês: saldo, receitas e despesas, gráfico de fluxo de caixa, gastos por categoria e metas em progresso"
          loading="eager"
          fetchpriority="high"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-hero {
  position: relative;
  overflow: hidden;
  padding-block: clamp(var(--space-8), 9vw, 96px) 0;
  background:
    radial-gradient(52% 42% at 18% 4%, var(--landing-glow-cyan), transparent 70%),
    radial-gradient(40% 34% at 86% 16%, var(--landing-glow-green), transparent 72%),
    linear-gradient(var(--landing-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--landing-grid-line) 1px, transparent 1px);
  background-size:
    auto,
    auto,
    52px 52px,
    52px 52px;
}

.landing-hero__inner {
  display: grid;
  justify-items: center;
  gap: var(--space-5);
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
  text-align: center;
}

.landing-hero__kicker {
  margin: 0;
  color: var(--landing-cyan);
  font-family: var(--font-mono);
  font-size: var(--landing-size-kicker);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--landing-tracking-kicker);
  text-transform: uppercase;
  animation: auraxis-fade-up var(--motion-duration-lg) var(--motion-ease-emphasized) both;
}

.landing-hero__title {
  max-width: 17ch;
  margin: 0;
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-display);
  font-weight: var(--font-weight-medium);
  line-height: var(--landing-leading-display);
  letter-spacing: -0.015em;
  animation: auraxis-fade-up var(--motion-duration-lg) var(--motion-ease-emphasized) both;
  animation-delay: 60ms;
}

.landing-hero__title-accent {
  background: var(--landing-grad);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-style: italic;
  padding-inline-end: 0.06em;
}

.landing-hero__lead {
  max-width: 62ch;
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-lead);
  line-height: var(--landing-leading-body);
  animation: auraxis-fade-up var(--motion-duration-lg) var(--motion-ease-emphasized) both;
  animation-delay: 120ms;
}

.landing-hero__actions {
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  animation: auraxis-fade-up var(--motion-duration-lg) var(--motion-ease-emphasized) both;
  animation-delay: 180ms;
}

.landing-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.landing-hero__cta:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.landing-hero__cta:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
}

.landing-hero__note {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  color: var(--landing-muted);
  font-size: var(--landing-size-fine);
}

.landing-hero__note svg {
  color: var(--landing-green);
  flex: 0 0 auto;
}

.landing-hero__frame {
  position: relative;
  width: min(100%, 980px);
  margin: var(--space-5) 0 calc(var(--space-8) * -1);
  animation: auraxis-fade-up var(--motion-duration-xl) var(--motion-ease-emphasized) both;
  animation-delay: 240ms;
}

/* Crop the hero frame at the section fold — the dashboard "peeks" out. */
.landing-hero__frame :deep(.landing-frame) {
  border-bottom: none;
  border-radius: var(--landing-radius-frame) var(--landing-radius-frame) 0 0;
}

@media (max-width: 640px) {
  .landing-hero__inner {
    width: min(1120px, calc(100% - 24px));
  }

  .landing-hero__frame {
    margin-bottom: calc(var(--space-6) * -1);
  }
}
</style>
