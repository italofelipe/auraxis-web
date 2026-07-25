<script setup lang="ts">
import { MessageCircle, Newspaper, Radar } from "lucide-vue-next";
import type { Component } from "vue";
import { LANDING_AI_HIGHLIGHTS, type LandingAiHighlightKey } from "../model/landing-content";
import LandingBrowserFrame from "./LandingBrowserFrame.vue";

const highlightIcons: Record<LandingAiHighlightKey, Component> = {
  radar: Radar,
  chat: MessageCircle,
  briefing: Newspaper,
};
</script>

<template>
  <section class="landing-ai" aria-labelledby="landing-ai-title" data-testid="landing-ai">
    <div class="landing-ai__inner">
      <div class="landing-ai__head">
        <p class="landing-ai__kicker">O diferencial</p>
        <h2 id="landing-ai-title" class="landing-ai__title">
          Uma IA que lê o seu mês <em>por você</em>.
        </h2>
        <p class="landing-ai__lead">
          Não é um chatbot genérico: a inteligência do Auraxis analisa os seus lançamentos, com o
          seu consentimento, e transforma números em decisões.
        </p>
      </div>

      <div class="landing-ai__body">
        <ul class="landing-ai__list">
          <li
            v-for="item in LANDING_AI_HIGHLIGHTS"
            :key="item.key"
            class="landing-ai__item"
          >
            <component :is="highlightIcons[item.key]" :size="20" aria-hidden="true" />
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </li>
        </ul>

        <LandingBrowserFrame
          url="app.auraxis.com.br/insights"
          src="/landing/insights-light.png"
          alt="Leitura editorial de insights do Auraxis com análise do mês gerada por IA, comparações de gastos e destaques de atenção"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.landing-ai {
  position: relative;
  overflow: hidden;
  padding-block: clamp(var(--space-8), 9vw, 112px);
  border-top: 1px solid var(--landing-line-soft);
  background:
    radial-gradient(46% 52% at 84% 10%, var(--landing-glow-cyan), transparent 70%),
    var(--landing-bg-raised);
}

.landing-ai__inner {
  display: grid;
  gap: clamp(var(--space-6), 5vw, var(--space-8));
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
}

.landing-ai__head {
  display: grid;
  gap: var(--space-3);
  max-width: 720px;
}

.landing-ai__kicker {
  margin: 0;
  color: var(--landing-cyan);
  font-family: var(--font-mono);
  font-size: var(--landing-size-kicker);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--landing-tracking-kicker);
  text-transform: uppercase;
}

.landing-ai__title {
  margin: 0;
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: var(--landing-leading-h2);
  letter-spacing: -0.01em;
}

.landing-ai__title em {
  background: var(--landing-grad);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  padding-inline-end: 0.06em;
}

.landing-ai__lead {
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-lead);
  line-height: var(--landing-leading-body);
}

.landing-ai__body {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(var(--space-5), 5vw, var(--space-8));
  align-items: center;
}

.landing-ai__list {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.landing-ai__item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
  padding: var(--space-4);
  border: 1px solid var(--landing-line-soft);
  border-radius: var(--landing-radius-card);
  background: color-mix(in srgb, var(--landing-surface) 62%, transparent);
  transition: border-color var(--motion-fast);
}

.landing-ai__item:hover {
  border-color: color-mix(in srgb, var(--landing-green) 32%, var(--landing-line-soft));
}

.landing-ai__item svg {
  width: 40px;
  height: 40px;
  padding: 9px;
  border-radius: var(--radius-sm);
  background: rgba(66, 232, 169, 0.1);
  color: var(--landing-green);
}

.landing-ai__item h3 {
  margin: 0 0 var(--space-1);
  color: var(--landing-ink);
  font-size: var(--landing-size-h3);
  font-weight: var(--font-weight-semibold);
}

.landing-ai__item p {
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-sm);
  line-height: var(--landing-leading-body);
}

@media (max-width: 900px) {
  .landing-ai__body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .landing-ai__inner {
    width: min(1120px, calc(100% - 24px));
  }
}
</style>
