<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
import { LANDING_LOGIN_URL, LANDING_REGISTER_URL } from "../model/landing-content";
</script>

<template>
  <section class="landing-cta" aria-labelledby="landing-cta-title">
    <div class="landing-cta__inner">
      <h2 id="landing-cta-title" class="landing-cta__title">
        Comece hoje. Agradeça no fim do mês.
      </h2>
      <p class="landing-cta__lead">
        Crie sua conta em menos de dois minutos, registre os primeiros lançamentos e veja o seu mês
        inteiro em contexto.
      </p>
      <a :href="LANDING_REGISTER_URL" class="landing-cta__button" data-testid="landing-cta-final">
        Criar conta gratuita
        <ArrowRight :size="17" aria-hidden="true" />
      </a>
      <p class="landing-cta__login">
        Já tem conta? <a :href="LANDING_LOGIN_URL">Entrar</a>
      </p>
    </div>
  </section>
</template>

<style scoped>
.landing-cta {
  position: relative;
  overflow: hidden;
  padding-block: clamp(var(--space-8), 9vw, 112px);
  border-top: 1px solid var(--landing-line-soft);
  background:
    radial-gradient(56% 70% at 50% 118%, rgba(68, 212, 255, 0.2), transparent 72%),
    var(--landing-bg);
}

.landing-cta__inner {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  width: min(760px, calc(100% - 40px));
  margin-inline: auto;
  text-align: center;
}

.landing-cta__title {
  margin: 0;
  color: var(--landing-ink);
  font-family: var(--landing-font-display);
  font-size: var(--landing-size-h2);
  font-weight: var(--font-weight-medium);
  line-height: var(--landing-leading-h2);
  letter-spacing: -0.01em;
}

.landing-cta__lead {
  margin: 0;
  color: var(--landing-body);
  font-size: var(--landing-size-lead);
  line-height: var(--landing-leading-body);
}

.landing-cta__button {
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

.landing-cta__button:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
}

.landing-cta__button:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
}

.landing-cta__login {
  margin: 0;
  color: var(--landing-muted);
  font-size: var(--landing-size-sm);
}

.landing-cta__login a {
  color: var(--landing-cyan);
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.landing-cta__login a:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
  border-radius: var(--radius-xs);
}

@media (max-width: 640px) {
  .landing-cta__inner {
    width: min(760px, calc(100% - 24px));
  }
}
</style>
