<script setup lang="ts">
import { useLandingCtaTracking } from "../composables/useLandingCtaTracking";
import { LANDING_LOGIN_URL, LANDING_REGISTER_URL } from "../model/landing-content";

const { trackCta } = useLandingCtaTracking();
</script>

<template>
  <header class="landing-header">
    <div class="landing-header__inner">
      <span class="landing-header__brand">
        <span class="landing-header__brand-mark" aria-hidden="true">A</span>
        <span class="landing-header__brand-name">Auraxis</span>
      </span>

      <nav class="landing-header__actions" aria-label="Acesso ao aplicativo">
        <a :href="LANDING_LOGIN_URL" class="landing-header__login" data-testid="landing-login-link">
          Entrar
        </a>
        <a
          :href="LANDING_REGISTER_URL"
          class="landing-header__cta"
          data-testid="landing-header-register"
          @click="trackCta('header-register', LANDING_REGISTER_URL)"
        >
          Criar conta
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.landing-header {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid var(--landing-line-soft);
  background: color-mix(in srgb, var(--landing-bg) 82%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.landing-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
  padding-block: var(--space-3);
}

.landing-header__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--landing-ink);
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: -0.02em;
}

.landing-header__brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-size: var(--font-size-md);
}

.landing-header__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.landing-header__login {
  color: var(--landing-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: color var(--motion-fast);
}

.landing-header__login:hover,
.landing-header__login:focus-visible {
  color: var(--landing-ink);
}

.landing-header__cta {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding-inline: var(--space-4);
  border-radius: var(--landing-radius-pill);
  background: var(--landing-grad);
  color: var(--landing-cyan-ink);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition:
    transform var(--motion-fast),
    box-shadow var(--motion-fast);
}

.landing-header__cta:hover {
  transform: translateY(-1px);
  box-shadow: var(--landing-shadow-cta);
}

.landing-header__login:focus-visible,
.landing-header__cta:focus-visible {
  outline: 3px solid var(--landing-glow-cyan);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .landing-header__inner {
    width: min(1120px, calc(100% - 24px));
  }
}
</style>
